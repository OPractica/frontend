import { useEffect, useRef, useState } from "react";
import { Button, Input, Tooltip, message, theme as antdTheme } from "antd";
import { AudioOutlined, CloseOutlined, RobotOutlined, SendOutlined } from "@ant-design/icons";
import { ApiError } from "../../shared/api/client";
import { useLanguage } from "../../shared/i18n/language";
import { sendChat } from "./aiApi";

type Mode = "closed" | "choose" | "text";
type ChatMessage = { from: "user" | "ai"; text: string; error?: boolean };

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
 * Tastatura deschide un mic chat cu asistentul; microfonul va trimite vocea când backend-ul are adresa pentru înregistrări.
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

  // Lista de mesaje coboară singură la ultimul mesaj
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async () => {
    const q = text.trim();
    if (!q || busy) return;
    setText("");
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
      setMessages((m) => [...m, { from: "ai", text: error, error: true }]);
    } finally {
      setBusy(false);
    }
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
            <Button shape="circle" icon={<CloseOutlined />} aria-label={t.ai.close} onClick={() => setMode("closed")} />
          </Tooltip>
          <Tooltip title={t.ai.voice}>
            <Button shape="circle" icon={<AudioOutlined />} aria-label={t.ai.voice} style={ROUND} onClick={() => messageApi.info(t.ai.voiceSoon)} />
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