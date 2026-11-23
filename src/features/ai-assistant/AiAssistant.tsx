import { useEffect, useRef, useState } from "react";
import { Button, Input, Tooltip, message, theme as antdTheme } from "antd";
import { AudioOutlined, BorderOutlined, CloseOutlined, RobotOutlined, SendOutlined } from "@ant-design/icons";
import { ApiError } from "../../shared/api/client";
import { useLanguage } from "../../shared/i18n/language";
import { sendChat, transcribe } from "./aiApi";

type Mode = "closed" | "choose" | "text";
type ChatMessage = { from: "user" | "ai"; text: string; error?: boolean };
type Voice = "idle" | "recording" | "transcribing";

// După atâtea secunde înregistrarea se oprește singură
const MAX_RECORDING_SECONDS = 60;
// Limita lui POST /ai/chat pentru text
const MAX_TEXT = 2000;

// Ant Design nu are o iconiță de tastatură, așa că e desenată aici
const KeyboardIcon = () => (
  <span className="anticon" role="img" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h4M18 13h.01M8 16h8" />
    </svg>
  </span>
);

const ROUND = { width: 56, height: 56, fontSize: 22, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" } as const;

type Props = {
  /** Asistentul cere logare (POST /ai/chat e protejat). */
  signedIn: boolean;
  /** Se cheamă după fiecare răspuns, ca pagina să reîncarce harta (asistentul poate rezerva sau anula). */
  onReply?: () => void;
};

/**
 * Butonul rotund din colțul de jos: la apăsare se desface în microfon și tastatură.
 * Tastatura deschide un mic chat cu asistentul. Microfonul înregistrează vocea, o trimite la POST /voice/transcribe,
 * iar textul recunoscut apare în același chat și pleacă la asistent, ca un mesaj scris.
 */
export default function AiAssistant({ signedIn, onReply }: Props) {
  const { t } = useLanguage();
  const { token } = antdTheme.useToken();
  const [messageApi, contextHolder] = message.useMessage();

  const [mode, setMode] = useState<Mode>("closed");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  // Id-ul conversației: cu el asistentul ține minte mesajele de dinainte
  const [sessionId, setSessionId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [voice, setVoice] = useState<Voice>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  // La închiderea asistentului în timpul înregistrării, sunetul nu se mai trimite
  const discardRef = useRef(false);

  // Lista de mesaje coboară singură la ultimul mesaj
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy, voice]);

  // Dacă pagina se închide în timpul înregistrării, microfonul se eliberează
  useEffect(
    () => () => {
      discardRef.current = true;
      window.clearTimeout(timerRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    },
    [],
  );

  const addError = (error: string) => setMessages((m) => [...m, { from: "ai", text: error, error: true }]);

  const ask = async (q: string) => {
    setMessages((m) => [...m, { from: "user", text: q }]);
    setBusy(true);
    try {
      const reply = await sendChat(q, sessionId);
      setSessionId(reply.session_id);
      setMessages((m) => [...m, { from: "ai", text: reply.answer }]);
      onReply?.();
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "";
      const status = e instanceof ApiError ? e.status : 0;
      const error =
        status === 401 ? t.ai.signIn : code === "ai_busy" ? t.ai.busy : code === "ai_unavailable" ? t.ai.unavailable : t.ai.failed;
      addError(error);
    } finally {
      setBusy(false);
    }
  };

  const send = () => {
    const q = text.trim();
    if (!q || busy) return;
    setText("");
    void ask(q);
  };

  // Înregistrarea terminată: se transformă în text, iar textul pleacă la asistent
  const handleAudio = async (audio: Blob) => {
    setVoice("transcribing");
    try {
      const q = (await transcribe(audio)).transcription.trim();
      // La liniște sau zgomot, recunoașterea poate întoarce doar semne („.”); fără nicio literă nu e un mesaj
      if (!/\p{L}/u.test(q)) addError(t.ai.voiceNotUnderstood);
      else if (q.length > MAX_TEXT) addError(t.ai.voiceTooLong);
      else {
        setVoice("idle");
        await ask(q);
      }
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      const error =
        status === 401
          ? t.ai.signIn
          : status === 413
            ? t.ai.voiceTooLong
            : status === 415 || status === 422
              ? t.ai.voiceNotUnderstood
              : status === 429
                ? t.ai.busy
                : status === 503
                  ? t.ai.unavailable
                  : t.ai.failed;
      addError(error);
    } finally {
      setVoice("idle");
    }
  };

  const startRecording = async () => {
    if (!signedIn) {
      messageApi.warning(t.ai.signIn);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      messageApi.error(t.ai.noMic);
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      messageApi.error(t.ai.micDenied);
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop()); // se stinge indicatorul de microfon al browserului
      recorderRef.current = null;
      if (discardRef.current) return;
      const audio = new Blob(chunks, { type: recorder.mimeType });
      if (audio.size === 0) addError(t.ai.voiceNotUnderstood);
      else void handleAudio(audio);
    };

    discardRef.current = false;
    recorderRef.current = recorder;
    recorder.start();
    setVoice("recording");
    setMode("text"); // chat-ul se deschide, ca să se vadă ce s-a înțeles și ce răspunde asistentul
    timerRef.current = window.setTimeout(() => stopRecording(), MAX_RECORDING_SECONDS * 1000);
  };

  const stopRecording = (discard = false) => {
    window.clearTimeout(timerRef.current);
    discardRef.current = discard;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setVoice("idle");
  };

  const close = () => {
    if (voice === "recording") stopRecording(true);
    setMode("closed");
  };

  const chat = (
    <div
      style={{
        width: 340,
        maxWidth: "calc(100vw - 48px)",
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "10px 12px", fontWeight: 600, borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
        <RobotOutlined /> {t.ai.title}
      </div>

      <div ref={listRef} style={{ height: 280, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {messages.length === 0 && <div style={{ color: token.colorTextSecondary, fontSize: 13 }}>{signedIn ? t.ai.hint : t.ai.signIn}</div>}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "6px 10px",
              borderRadius: 10,
              fontSize: 13,
              whiteSpace: "pre-wrap",
              background: m.from === "user" ? token.colorPrimaryBg : token.colorFillTertiary,
              color: m.error ? token.colorError : token.colorText,
            }}
          >
            {m.text}
          </div>
        ))}
        {voice === "recording" && <div style={{ color: token.colorError, fontSize: 13 }}>{t.ai.listening}</div>}
        {voice === "transcribing" && <div style={{ color: token.colorTextSecondary, fontSize: 13 }}>{t.ai.transcribing}</div>}
        {busy && <div style={{ color: token.colorTextSecondary, fontSize: 13 }}>{t.ai.thinking}</div>}
      </div>

      {signedIn && (
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          <Input
            autoFocus
            value={text}
            maxLength={2000}
            placeholder={t.ai.placeholder}
            onChange={(e) => setText(e.target.value)}
            onPressEnter={send}
          />
          <Button type="primary" icon={<SendOutlined />} aria-label={t.ai.send} loading={busy} onClick={send} />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
      {contextHolder}
      {mode === "text" && chat}

      {mode === "closed" ? (
        <Tooltip title={t.ai.open} placement="left">
          <Button type="primary" shape="circle" icon={<RobotOutlined />} aria-label={t.ai.open} style={ROUND} onClick={() => setMode("choose")} />
        </Tooltip>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Tooltip title={t.ai.close}>
            <Button shape="circle" icon={<CloseOutlined />} aria-label={t.ai.close} onClick={close} />
          </Tooltip>
          <Tooltip title={voice === "recording" ? t.ai.stop : t.ai.voice}>
            {voice === "recording" ? (
              <Button type="primary" danger shape="circle" icon={<BorderOutlined />} aria-label={t.ai.stop} style={ROUND} onClick={() => stopRecording()} />
            ) : (
              <Button
                shape="circle"
                icon={<AudioOutlined />}
                aria-label={t.ai.voice}
                style={ROUND}
                loading={voice === "transcribing"}
                disabled={busy}
                onClick={startRecording}
              />
            )}
          </Tooltip>
          <Tooltip title={t.ai.keyboard}>
            <Button
              type={mode === "text" ? "primary" : "default"}
              shape="circle"
              icon={<KeyboardIcon />}
              aria-label={t.ai.keyboard}
              style={ROUND}
              onClick={() => setMode(mode === "text" ? "choose" : "text")}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
}