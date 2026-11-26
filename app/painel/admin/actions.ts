"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { exigirAdmin, sessaoLogada } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { apagarImagem, enviarImagem } from "@/lib/storage";

const FERRAMENTAS = "/painel/admin/ferramentas";
const AVISOS = "/painel/admin/avisos";

function txt(form: FormData, nome: string, max: number): string {
  return String(form.get(nome) ?? "").trim().slice(0, max);
}

function marcado(form: FormData, nome: string): boolean {
  return form.get(nome) === "on";
}

/** Só aceita http(s) ou caminho interno. Barra "javascript:" e parecidos. */
function urlOk(v: string): string | null {
  if (/^https?:\/\/[^\s]+$/i.test(v)) return v;
  if (v.startsWith("/") && !v.startsWith("//") && !/\s/.test(v)) return v;
  return null;
}

function limpar(caminho: string) {
  revalidateTag("catalogo");
  revalidateTag("avisos");
  revalidateTag("posts");
  revalidatePath("/painel");
  revalidatePath(caminho);
}

function voltar(caminho: string, tipo: "ok" | "erro", msg: string): never {
  redirect(`${caminho}?${tipo}=${encodeURIComponent(msg)}`);
}

function falhou(caminho: string, e: unknown): never {
  const m = (e as { message?: string } | null)?.message ?? "";
  if (/does not exist|schema cache|could not find/i.test(m)) {
    voltar(
      caminho,
      "erro",
      "Faltam tabelas ou colunas no Supabase. No SQL Editor, rode supabase/comunidade-etapa1.sql e depois supabase/comunidade-etapa2.sql.",
    );
  }
  voltar(caminho, "erro", "Não foi possível salvar agora. Tente de novo.");
}

/** Lê o próximo número de ordem (maior + 10) de uma tabela. */
async function proximaOrdem(tabela: "modulos" | "itens", filtro?: { coluna: string; valor: string }): Promise<number> {
  let q = supabaseAdmin().from(tabela).select("ordem").order("ordem", { ascending: false }).limit(1);
  if (filtro) q = q.eq(filtro.coluna, filtro.valor);
  const { data } = await q;
  return ((data?.[0] as { ordem?: number } | undefined)?.ordem ?? 0) + 10;
}

/** Troca a posição de um registro com o vizinho e regrava a ordem de todos em 10, 20, 30… */
async function mover(tabela: "modulos" | "itens", id: string, dir: string, filtro?: { coluna: string; valor: string }) {
  const db = supabaseAdmin();
  let q = db.from(tabela).select("id").order("ordem").order("criado_em");
  if (filtro) q = q.eq(filtro.coluna, filtro.valor);
  const { data, error } = await q;
  if (error) throw error;
  const ids = (data ?? []).map((r: { id: string }) => r.id);
  const i = ids.indexOf(id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (let k = 0; k < ids.length; k++) {
    const { error: e } = await db.from(tabela).update({ ordem: (k + 1) * 10 }).eq("id", ids[k]);
    if (e) throw e;
  }
}

const CORES = ["op", "calc", "ia", "aula"];

// ---------------- Módulos ----------------

export async function criarModulo(form: FormData) {
  await exigirAdmin();
  const titulo = txt(form, "titulo", 80);
  const cor = txt(form, "cor", 10);
  if (!titulo) voltar(FERRAMENTAS, "erro", "Dê um nome ao módulo.");
  try {
    const ordem = await proximaOrdem("modulos");
    const { error } = await supabaseAdmin()
      .from("modulos")
      .insert({ titulo, cor: CORES.includes(cor) ? cor : "op", ordem });
    if (error) throw error;
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  voltar(FERRAMENTAS, "ok", "Módulo criado.");
}

export async function salvarModulo(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  const titulo = txt(form, "titulo", 80);
  const cor = txt(form, "cor", 10);
  if (!id || !titulo) voltar(FERRAMENTAS, "erro", "Dê um nome ao módulo.");
  try {
    const { error } = await supabaseAdmin()
      .from("modulos")
      .update({ titulo, cor: CORES.includes(cor) ? cor : "op", visivel: marcado(form, "visivel") })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  voltar(FERRAMENTAS, "ok", "Módulo salvo.");
}

export async function excluirModulo(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  try {
    const { error } = await supabaseAdmin().from("modulos").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  voltar(FERRAMENTAS, "ok", "Módulo excluído.");
}

export async function moverModulo(form: FormData) {
  await exigirAdmin();
  try {
    await mover("modulos", txt(form, "id", 40), txt(form, "dir", 4));
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  redirect(FERRAMENTAS);
}

// ---------------- Ferramentas ----------------

type CamposItem = {
  modulo_id: string;
  titulo: string;
  descricao: string;
  tag: string;
  icone: string;
  url: string;
  destaque: boolean;
  visivel: boolean;
};

function lerItem(form: FormData): CamposItem {
  const url = urlOk(txt(form, "url", 600));
  const titulo = txt(form, "titulo", 120);
  const modulo_id = txt(form, "modulo_id", 40);
  if (!titulo) voltar(FERRAMENTAS, "erro", "Dê um nome à ferramenta.");
  if (!url) voltar(FERRAMENTAS, "erro", "O link precisa começar com https://");
  if (!modulo_id) voltar(FERRAMENTAS, "erro", "Escolha o módulo.");
  return {
    modulo_id,
    titulo,
    descricao: txt(form, "descricao", 400),
    tag: txt(form, "tag", 30),
    icone: txt(form, "icone", 20) || "grid",
    url,
    destaque: marcado(form, "destaque"),
    visivel: marcado(form, "visivel"),
  };
}

export async function criarItem(form: FormData) {
  await exigirAdmin();
  const campos = lerItem(form);
  try {
    const ordem = await proximaOrdem("itens", { coluna: "modulo_id", valor: campos.modulo_id });
    const { error } = await supabaseAdmin().from("itens").insert({ ...campos, ordem });
    if (error) throw error;
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  voltar(FERRAMENTAS, "ok", "Ferramenta criada.");
}

export async function salvarItem(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  const campos = lerItem(form);
  try {
    const { error } = await supabaseAdmin().from("itens").update(campos).eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  voltar(FERRAMENTAS, "ok", "Ferramenta salva.");
}

export async function excluirItem(form: FormData) {
  await exigirAdmin();
  try {
    const { error } = await supabaseAdmin().from("itens").delete().eq("id", txt(form, "id", 40));
    if (error) throw error;
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  voltar(FERRAMENTAS, "ok", "Ferramenta excluída.");
}

export async function moverItem(form: FormData) {
  await exigirAdmin();
  try {
    await mover("itens", txt(form, "id", 40), txt(form, "dir", 4), {
      coluna: "modulo_id",
      valor: txt(form, "modulo_atual", 40),
    });
  } catch (e) {
    falhou(FERRAMENTAS, e);
  }
  limpar(FERRAMENTAS);
  redirect(FERRAMENTAS);
}

// ---------------- Avisos ----------------

const TIPOS = ["info", "importante", "urgente"];

/** "2026-11-30T18:00" (horário de Brasília) -> ISO. Vazio = não expira. */
function lerExpira(form: FormData): string | null {
  const v = txt(form, "expira_em", 20);
  if (!v) return null;
  const d = new Date(`${v}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function lerAviso(form: FormData) {
  const titulo = txt(form, "titulo", 140);
  if (!titulo) voltar(AVISOS, "erro", "Escreva o título do aviso.");
  const linkBruto = txt(form, "link_url", 600);
  const link_url = linkBruto ? urlOk(linkBruto) : null;
  if (linkBruto && !link_url) voltar(AVISOS, "erro", "O link do botão precisa começar com https://");
  const tipo = txt(form, "tipo", 12);
  return {
    titulo,
    texto: txt(form, "texto", 800),
    tipo: TIPOS.includes(tipo) ? tipo : "info",
    link_url,
    link_texto: link_url ? txt(form, "link_texto", 40) || "Abrir" : null,
    ativo: marcado(form, "ativo"),
    expira_em: lerExpira(form),
  };
}

/** Cuida da imagem do formulário: envia nova, mantém a atual ou remove. Devolve o link final. */
async function resolverImagem(
  form: FormData,
  pasta: "posts" | "avisos",
  caminho: string,
  atual: string | null,
): Promise<string | null> {
  try {
    const nova = await enviarImagem(form.get("imagem"), pasta);
    if (nova) {
      await apagarImagem(atual);
      return nova;
    }
    if (marcado(form, "remover_imagem")) {
      await apagarImagem(atual);
      return null;
    }
    return atual;
  } catch (e) {
    const m = (e as { message?: string } | null)?.message ?? "";
    if (/bucket not found/i.test(m)) voltar(caminho, "erro", "A pasta de imagens ainda não existe. Rode o arquivo supabase/comunidade-etapa2.sql.");
    voltar(caminho, "erro", m && m.length < 120 ? m : "Não foi possível enviar a imagem.");
  }
}

async function imagemAtual(tabela: "posts" | "avisos", id: string): Promise<string | null> {
  const { data } = await supabaseAdmin().from(tabela).select("imagem_url").eq("id", id).maybeSingle();
  return (data as { imagem_url?: string | null } | null)?.imagem_url ?? null;
}

export async function criarAviso(form: FormData) {
  await exigirAdmin();
  const campos = lerAviso(form);
  const imagem_url = await resolverImagem(form, "avisos", AVISOS, null);
  try {
    const { error } = await supabaseAdmin().from("avisos").insert({ ...campos, imagem_url });
    if (error) throw error;
  } catch (e) {
    falhou(AVISOS, e);
  }
  limpar(AVISOS);
  voltar(AVISOS, "ok", "Aviso publicado no topo do painel.");
}

export async function salvarAviso(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  const campos = lerAviso(form);
  const imagem_url = await resolverImagem(form, "avisos", AVISOS, await imagemAtual("avisos", id));
  try {
    const { error } = await supabaseAdmin().from("avisos").update({ ...campos, imagem_url }).eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(AVISOS, e);
  }
  limpar(AVISOS);
  voltar(AVISOS, "ok", "Aviso salvo.");
}

export async function excluirAviso(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  try {
    await apagarImagem(await imagemAtual("avisos", id));
    const { error } = await supabaseAdmin().from("avisos").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(AVISOS, e);
  }
  limpar(AVISOS);
  voltar(AVISOS, "ok", "Aviso excluído.");
}

// ---------------- Postagens (novidades) ----------------

const POSTS = "/painel/admin/posts";
const FORMATOS = ["quadrada", "retrato", "banner"];

function lerPost(form: FormData) {
  const titulo = txt(form, "titulo", 160);
  if (!titulo) voltar(POSTS, "erro", "Escreva o título da postagem.");
  const formato = txt(form, "formato", 10);
  return {
    titulo,
    corpo: txt(form, "corpo", 8000),
    formato: FORMATOS.includes(formato) ? formato : null,
    fixado: marcado(form, "fixado"),
    publicado: marcado(form, "publicado"),
  };
}

export async function criarPost(form: FormData) {
  const email = await exigirAdmin();
  const sessao = await sessaoLogada();
  const campos = lerPost(form);
  const imagem_url = await resolverImagem(form, "posts", POSTS, null);
  try {
    const { error } = await supabaseAdmin()
      .from("posts")
      .insert({ ...campos, formato: imagem_url ? campos.formato ?? "quadrada" : null, imagem_url, autor_email: email, autor_nome: sessao?.nome ?? null });
    if (error) throw error;
  } catch (e) {
    falhou(POSTS, e);
  }
  limpar(POSTS);
  revalidatePath("/painel/novidades");
  voltar(POSTS, "ok", "Postagem publicada.");
}

export async function salvarPost(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  const campos = lerPost(form);
  const imagem_url = await resolverImagem(form, "posts", POSTS, await imagemAtual("posts", id));
  try {
    const { error } = await supabaseAdmin()
      .from("posts")
      .update({ ...campos, formato: imagem_url ? campos.formato ?? "quadrada" : null, imagem_url })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(POSTS, e);
  }
  limpar(POSTS);
  revalidatePath("/painel/novidades");
  revalidatePath(`/painel/novidades/${id}`);
  voltar(POSTS, "ok", "Postagem salva.");
}

export async function excluirPost(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  try {
    await apagarImagem(await imagemAtual("posts", id));
    const { error } = await supabaseAdmin().from("posts").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(POSTS, e);
  }
  limpar(POSTS);
  revalidatePath("/painel/novidades");
  voltar(POSTS, "ok", "Postagem excluída.");
}
