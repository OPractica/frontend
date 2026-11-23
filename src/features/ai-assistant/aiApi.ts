import { request } from "../../shared/api/client";

/** Răspunsul asistentului: textul și id-ul conversației, care se trimite înapoi la mesajul următor. */
export type ChatReply = { answer: string; session_id: string };

/** POST /ai/chat (vezi API_CONTRACT.md, secțiunea AI chat). */
export function sendChat(text: string, sessionId: string | null) {
  return request<ChatReply>("/ai/chat", {
    method: "POST",
    body: JSON.stringify({ text, session_id: sessionId }),
  });
}

/** Din răspunsul lui POST /voice/transcribe folosim doar textul recunoscut, care apoi merge la chat. */
export type VoiceReply = { transcription: string; language: string };

// Backend-ul verifică extensia fișierului, așa că numele trebuie să corespundă formatului înregistrat de browser
function fileName(type: string) {
  if (type.includes("mp4")) return "recording.mp4";
  if (type.includes("ogg")) return "recording.ogg";
  if (type.includes("wav")) return "recording.wav";
  return "recording.webm";
}

/** POST /voice/transcribe: înregistrarea se trimite ca fișier (multipart/form-data), limba se detectează automat. */
export function transcribe(audio: Blob) {
  const form = new FormData();
  form.append("file", audio, fileName(audio.type));
  form.append("language", "auto");
  return request<VoiceReply>("/voice/transcribe", { method: "POST", body: form });
}