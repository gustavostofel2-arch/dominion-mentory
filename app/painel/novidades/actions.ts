"use server";

import { revalidatePath } from "next/cache";
import { eAdminAgora, sessaoLogada } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type EstadoComentario = { erro?: string; ok?: number };

const UUID = /^[0-9a-f-]{36}$/i;

function atualizar(postId?: string) {
  revalidatePath("/painel");
  revalidatePath("/painel/novidades");
  if (postId) revalidatePath(`/painel/novidades/${postId}`);
}

/** Curtir / descurtir. Devolve o estado novo para a tela atualizar na hora. */
export async function alternarCurtida(postId: string): Promise<{ curtidas: number; euCurti: boolean } | null> {
  const s = await sessaoLogada();
  if (!s || !UUID.test(postId)) return null;
  const db = supabaseAdmin();
  const { data: ja } = await db.from("curtidas").select("email").eq("post_id", postId).eq("email", s.email).maybeSingle();
  if (ja) await db.from("curtidas").delete().eq("post_id", postId).eq("email", s.email);
  else await db.from("curtidas").insert({ post_id: postId, email: s.email });
  const { count } = await db.from("curtidas").select("email", { count: "exact", head: true }).eq("post_id", postId);
  atualizar(postId);
  return { curtidas: count ?? 0, euCurti: !ja };
}

export async function comentar(_antes: EstadoComentario, form: FormData): Promise<EstadoComentario> {
  const s = await sessaoLogada();
  if (!s) return { erro: "Sua sessão expirou. Entre de novo." };
  const postId = String(form.get("post_id") ?? "");
  const texto = String(form.get("texto") ?? "").trim();
  if (!UUID.test(postId)) return { erro: "Postagem não encontrada." };
  if (!texto) return { erro: "Escreva algo antes de enviar." };
  if (texto.length > 500) return { erro: "O comentário pode ter no máximo 500 caracteres." };

  const db = supabaseAdmin();
  const { data: post } = await db.from("posts").select("id").eq("id", postId).eq("publicado", true).maybeSingle();
  if (!post) return { erro: "Postagem não encontrada." };

  // Limite simples contra spam: no máximo 5 comentários por minuto por pessoa.
  const desde = new Date(Date.now() - 60_000).toISOString();
  const { count } = await db.from("comentarios").select("id", { count: "exact", head: true }).eq("email", s.email).gte("criado_em", desde);
  if ((count ?? 0) >= 5) return { erro: "Calma! Aguarde um minutinho para comentar de novo." };

  const { error } = await db.from("comentarios").insert({ post_id: postId, email: s.email, nome: s.nome, texto });
  if (error) return { erro: "Não foi possível comentar agora. Tente de novo." };
  atualizar(postId);
  return { ok: Date.now() };
}

/** Cada pessoa apaga o próprio comentário; admin apaga qualquer um. */
export async function apagarComentario(form: FormData) {
  const s = await sessaoLogada();
  const id = String(form.get("id") ?? "");
  const postId = String(form.get("post_id") ?? "");
  if (!s || !UUID.test(id)) return;
  const db = supabaseAdmin();
  const { data } = await db.from("comentarios").select("email").eq("id", id).maybeSingle();
  if (!data) return;
  if ((data as { email: string }).email !== s.email && !(await eAdminAgora(s.email))) return;
  await db.from("comentarios").delete().eq("id", id);
  atualizar(UUID.test(postId) ? postId : undefined);
}
