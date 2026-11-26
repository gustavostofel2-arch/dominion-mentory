import "server-only";

/**
 * Tempo real: avisa os navegadores abertos que algo mudou (nova postagem, comentário…).
 * O sinal NÃO leva conteúdo (só o tipo), então quem escutar o canal de fora não lê nada da comunidade;
 * cada tela busca o conteúdo de verdade pelo servidor, já com login.
 */
export type EventoTR = { t: "post" | "aviso" | "notificacao" | "comentario" | "curtida" | "atualizou"; postId?: string };

export async function emitir(e: EventoTR): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ topic: "comunidade", event: "novo", payload: e, private: false }] }),
      signal: AbortSignal.timeout(2500),
    });
  } catch {
    // o tempo real é um extra: se falhar, a tela atualiza no próximo acesso
  }
}
