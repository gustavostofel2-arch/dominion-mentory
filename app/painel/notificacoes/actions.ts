"use server";

import { sessaoLogada } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { contarNaoLidas, lerLidoAte, listarNotificacoes, marcarLidas, type Notif } from "@/lib/notificar";

type Inscricao = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

/** Guarda o aparelho para receber push. */
export async function inscreverPush(sub: Inscricao, agente: string): Promise<{ ok: boolean }> {
  const s = await sessaoLogada();
  const endpoint = sub?.endpoint ?? "";
  const p256dh = sub?.keys?.p256dh ?? "";
  const auth = sub?.keys?.auth ?? "";
  if (!s || !/^https:\/\/[^\s]+$/.test(endpoint) || !p256dh || !auth) return { ok: false };
  const { error } = await supabaseAdmin()
    .from("push_inscricoes")
    .upsert({ endpoint, email: s.email, p256dh, auth, agente: agente.slice(0, 200) });
  return { ok: !error };
}

export async function cancelarPush(endpoint: string): Promise<{ ok: boolean }> {
  const s = await sessaoLogada();
  if (!s || !endpoint) return { ok: false };
  const { error } = await supabaseAdmin().from("push_inscricoes").delete().eq("endpoint", endpoint).eq("email", s.email);
  return { ok: !error };
}

/** Abre o sino: devolve a lista (marcando o que é novo) e zera o número vermelho. */
export async function abrirSino(): Promise<{ itens: Notif[]; naoLidas: number }> {
  const s = await sessaoLogada();
  if (!s) return { itens: [], naoLidas: 0 };
  const [itens, lidoAte] = await Promise.all([listarNotificacoes(15), lerLidoAte(s.email)]);
  const marcado = itens.map((n) => ({ ...n, nova: new Date(n.criadoEm).getTime() > new Date(lidoAte).getTime() }));
  await marcarLidas(s.email, true);
  return { itens: marcado, naoLidas: 0 };
}

export async function naoLidasAgora(): Promise<number> {
  const s = await sessaoLogada();
  return contarNaoLidas(s?.email ?? null);
}
