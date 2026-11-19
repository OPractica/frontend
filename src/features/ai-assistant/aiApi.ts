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