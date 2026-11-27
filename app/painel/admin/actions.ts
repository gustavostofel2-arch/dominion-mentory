"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { exigirAdmin, sessaoLogada } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { apagarImagem, enviarImagem } from "@/lib/storage";
import { conteudoVazio, limparDoc, textoPuro } from "@/lib/doc";
import { urlSegura } from "@/lib/blocos";
import { notificarTodos } from "@/lib/notificar";
import { emitir, type EventoTR } from "@/lib/tempo-real";

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
  return urlSegura(v) || null;
}

/** Manda o sinal em tempo real depois que a resposta já saiu (não atrasa o clique). */
function emitirDepois(e: EventoTR) {
  after(() => emitir(e));
}

/** Texto de retorno depois de avisar a comunidade. */
async function avisarComunidade(
  form: FormData,
  dados: { tipo: "post" | "aviso"; titulo: string; texto: string; link: string; imagemUrl: string | null; refId: string | null; autorEmail: string },
): Promise<string> {
  if (!marcado(form, "notificar")) return "";
  try {
    const r = await notificarTodos(dados);
    if (!r.ok) return " Não consegui enviar a notificação.";
    emitirDepois({ t: "notificacao" });
    if (r.semPush) return " Notificação enviada no sino (o push ainda não está configurado).";
    return ` Notificação enviada no sino e por push para ${r.push} aparelho(s).`;
  } catch {
    return " A notificação não pôde ser enviada agora.";
  }
}

function limpar(caminho: string) {
  revalidateTag("catalogo");
  revalidateTag("avisos");
  revalidateTag("posts");
  revalidateTag("notificacoes");
  revalidatePath("/painel");
  revalidatePath(caminho);
}

/**
 * Redirecionar para o MESMO endereço em que a pessoa já está faz o Next não trocar o conteúdo (a tela fica em branco).
 * Por isso todo redirecionamento leva um carimbo único (_=), que o navegador remove em seguida.
 */
function carimbo(): string {
  return Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
}

function voltar(caminho: string, tipo: "ok" | "erro", msg: string): never {
  redirect(`${caminho}?${tipo}=${encodeURIComponent(msg)}&_=${carimbo()}`);
}

function falhou(caminho: string, e: unknown): never {
  unstable_rethrow(e); // um redirect lançado dentro de try não é erro: deixa passar
  const m = (e as { message?: string } | null)?.message ?? "";
  if (/does not exist|schema cache|could not find/i.test(m)) {
    voltar(
      caminho,
      "erro",
      "Faltam tabelas ou colunas no Supabase. No SQL Editor, rode as etapas 1, 2, 3 e 4 (arquivos supabase/comunidade-etapa*.sql), nessa ordem.",
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
  redirect(`${FERRAMENTAS}?_=${carimbo()}`);
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
  const url = urlOk(String(form.get("url") ?? ""));
  const titulo = txt(form, "titulo", 120);
  const modulo_id = txt(form, "modulo_id", 40);
  if (!titulo) voltar(FERRAMENTAS, "erro", "Dê um nome à ferramenta.");
  if (!url) voltar(FERRAMENTAS, "erro", "Confira o link (ex.: https://site.com ou /painel/novidades).");
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
  redirect(`${FERRAMENTAS}?_=${carimbo()}`);
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
  const linkBruto = String(form.get("link_url") ?? "").trim();
  const link_url = linkBruto ? urlOk(linkBruto) : null;
  if (linkBruto && !link_url) voltar(AVISOS, "erro", "Confira o link do botão (ex.: https://site.com ou /painel/novidades).");
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
  apagarAntiga = true,
): Promise<string | null> {
  try {
    const nova = await enviarImagem(form.get("imagem"), pasta);
    if (nova) {
      if (apagarAntiga) await apagarImagem(atual);
      return nova;
    }
    if (marcado(form, "remover_imagem")) {
      if (apagarAntiga) await apagarImagem(atual);
      return null;
    }
    return atual;
  } catch (e) {
    const m = (e as { message?: string } | null)?.message ?? "";
    if (/bucket not found/i.test(m)) voltar(caminho, "erro", "A pasta de imagens ainda não existe. Rode o arquivo supabase/comunidade-etapa2.sql.");
    voltar(caminho, "erro", m && m.length < 120 ? m : "Não foi possível enviar a imagem.");
  }
}

/** O aviso nasceu de uma postagem? Então a imagem é da postagem e nunca deve ser apagada junto. */
async function avisoLigadoAPost(id: string): Promise<boolean> {
  const { data } = await supabaseAdmin().from("avisos").select("post_id").eq("id", id).maybeSingle();
  return !!(data as { post_id?: string | null } | null)?.post_id;
}

async function imagemAtual(tabela: "posts" | "avisos", id: string): Promise<string | null> {
  const { data } = await supabaseAdmin().from(tabela).select("imagem_url").eq("id", id).maybeSingle();
  return (data as { imagem_url?: string | null } | null)?.imagem_url ?? null;
}

export async function criarAviso(form: FormData) {
  const email = await exigirAdmin();
  const campos = lerAviso(form);
  const imagem_url = await resolverImagem(form, "avisos", AVISOS, null);
  try {
    const { error } = await supabaseAdmin().from("avisos").insert({ ...campos, imagem_url });
    if (error) throw error;
  } catch (e) {
    falhou(AVISOS, e);
  }
  const extra = campos.ativo
    ? await avisarComunidade(form, {
        tipo: "aviso",
        titulo: campos.titulo,
        texto: campos.texto.slice(0, 140),
        link: campos.link_url ?? "/painel",
        imagemUrl: imagem_url,
        refId: null,
        autorEmail: email,
      })
    : "";
  if (campos.ativo && !extra) emitirDepois({ t: "aviso" });
  limpar(AVISOS);
  voltar(AVISOS, "ok", (campos.ativo ? "Aviso publicado no carrossel do Início." : "Aviso salvo, mas está DESLIGADO: os alunos não veem.") + extra);
}

export async function salvarAviso(form: FormData) {
  const email = await exigirAdmin();
  const id = txt(form, "id", 40);
  const campos = lerAviso(form);
  const imagem_url = await resolverImagem(form, "avisos", AVISOS, await imagemAtual("avisos", id), !(await avisoLigadoAPost(id)));
  try {
    const { error } = await supabaseAdmin().from("avisos").update({ ...campos, imagem_url }).eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(AVISOS, e);
  }
  const extra = campos.ativo
    ? await avisarComunidade(form, {
        tipo: "aviso",
        titulo: campos.titulo,
        texto: campos.texto.slice(0, 140),
        link: campos.link_url ?? "/painel",
        imagemUrl: imagem_url,
        refId: id,
        autorEmail: email,
      })
    : "";
  if (!extra) emitirDepois({ t: "atualizou" });
  limpar(AVISOS);
  voltar(AVISOS, "ok", "Aviso salvo." + extra);
}

export async function excluirAviso(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  try {
    if (!(await avisoLigadoAPost(id))) await apagarImagem(await imagemAtual("avisos", id));
    const { error } = await supabaseAdmin().from("avisos").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(AVISOS, e);
  }
  emitirDepois({ t: "atualizou" });
  limpar(AVISOS);
  voltar(AVISOS, "ok", "Aviso excluído.");
}

// ---------------- Postagens (novidades) ----------------

const POSTS = "/painel/admin/posts";
const FORMATOS = ["quadrada", "retrato", "banner"];
const TIPOS_AVISO = ["info", "importante", "urgente"];

/** Para onde voltar depois da ação (a própria página de onde veio). Só caminhos do painel. */
function retornoDe(form: FormData, padrao = POSTS): string {
  const r = String(form.get("retorno") ?? "");
  const limpo = r.split("?")[0];
  return limpo.startsWith("/painel") && !limpo.startsWith("//") && !/\s/.test(limpo) ? limpo : padrao;
}

/** Texto rico do editor: só aceita o JSON com os estilos permitidos. */
function lerCorpo(form: FormData, volta: string): string {
  const bruto = String(form.get("corpo") ?? "").trim();
  if (!bruto) return "";
  if (bruto.length > 80000) voltar(volta, "erro", "O texto está grande demais.");
  if (!bruto.startsWith("{")) return bruto.slice(0, 8000);
  let doc;
  try {
    doc = limparDoc(JSON.parse(bruto));
  } catch {
    doc = null;
  }
  if (!doc) voltar(volta, "erro", "Não consegui ler o texto. Recarregue a página e tente de novo.");
  const limpo = JSON.stringify(doc);
  return conteudoVazio(limpo) ? "" : limpo;
}

function lerPost(form: FormData, volta: string) {
  const titulo = txt(form, "titulo", 160);
  if (!titulo) voltar(volta, "erro", "Escreva o título da postagem.");
  const formato = txt(form, "formato", 10);
  return {
    titulo,
    corpo: lerCorpo(form, volta),
    formato: FORMATOS.includes(formato) ? formato : null,
    fixado: marcado(form, "fixado"),
    publicado: marcado(form, "publicado"),
  };
}

type DadosPost = { id: string; titulo: string; corpo: string; publicado: boolean; imagem: string | null; formato: string | null };

/** Cria, atualiza ou remove o aviso ligado a uma postagem (o aviso leva para a postagem). */
async function sincronizarAviso(form: FormData, post: DadosPost): Promise<"criado" | "atualizado" | "removido" | "nenhum"> {
  const db = supabaseAdmin();
  const quer = marcado(form, "virar_aviso") && post.publicado;
  const { data: atual } = await db.from("avisos").select("id").eq("post_id", post.id).maybeSingle();
  if (!quer) {
    if (atual) {
      await db.from("avisos").delete().eq("post_id", post.id);
      return "removido";
    }
    return "nenhum";
  }
  const tipoBruto = txt(form, "aviso_tipo", 12);
  const dias = txt(form, "aviso_dias", 6);
  const campos: Record<string, unknown> = {
    titulo: post.titulo.slice(0, 140),
    texto: textoPuro(post.corpo).slice(0, 200),
    tipo: TIPOS_AVISO.includes(tipoBruto) ? tipoBruto : "importante",
    link_url: `/painel/novidades/${post.id}`,
    link_texto: "Ver postagem",
    ativo: true,
    imagem_url: post.formato === "banner" ? post.imagem : null,
  };
  if (dias !== "manter" || !atual) {
    const n = Number(dias);
    campos.expira_em = n > 0 ? new Date(Date.now() + n * 864e5).toISOString() : null;
  }
  if (atual) {
    const { error } = await db.from("avisos").update(campos).eq("post_id", post.id);
    if (error) throw error;
    return "atualizado";
  }
  const { error } = await db.from("avisos").insert({ ...campos, post_id: post.id });
  if (error) throw error;
  return "criado";
}

async function inserirPost(linha: Record<string, unknown>): Promise<string> {
  const db = supabaseAdmin();
  let r = await db.from("posts").insert(linha).select("id").single();
  if (r.error && /autor_usuario/i.test(r.error.message)) {
    // etapa 4 ainda não rodou no banco: grava sem o @ do autor
    const resto = { ...linha };
    delete resto.autor_usuario;
    r = await db.from("posts").insert(resto).select("id").single();
  }
  if (r.error) throw r.error;
  return (r.data as { id: string }).id;
}

/** Depois de salvar: sincroniza o aviso, avisa a comunidade (se marcado) e manda o sinal em tempo real. */
async function depoisDePost(form: FormData, p: DadosPost & { novo: boolean }, email: string): Promise<string> {
  let msg = "";
  let aviso: "criado" | "atualizado" | "removido" | "nenhum" = "nenhum";
  try {
    aviso = await sincronizarAviso(form, p);
  } catch (e) {
    const m = (e as { message?: string } | null)?.message ?? "";
    msg += /does not exist|schema cache|could not find|post_id/i.test(m)
      ? " Não consegui criar o aviso: rode o SQL da etapa 4 no Supabase."
      : " Não consegui criar o aviso.";
  }
  if (aviso === "criado" || aviso === "atualizado") msg += " Aviso no carrossel do Início.";
  if (aviso === "removido") msg += " Aviso removido do Início.";

  let notificou = false;
  if (p.publicado) {
    const extra = await avisarComunidade(form, {
      tipo: "post",
      titulo: p.titulo,
      texto: textoPuro(p.corpo).slice(0, 140),
      link: `/painel/novidades/${p.id}`,
      imagemUrl: p.imagem,
      refId: p.id,
      autorEmail: email,
    });
    notificou = extra !== "";
    msg += extra;
  }
  if (!notificou && p.publicado) {
    emitirDepois({ t: p.novo ? (aviso === "criado" ? "aviso" : "post") : "atualizou" });
  }
  return msg;
}

export async function criarPost(form: FormData) {
  const email = await exigirAdmin();
  const volta = retornoDe(form);
  const sessao = await sessaoLogada();
  const campos = lerPost(form, volta);
  const imagem_url = await resolverImagem(form, "posts", volta, null);
  const formato = imagem_url ? campos.formato ?? "quadrada" : null;
  let id = "";
  try {
    id = await inserirPost({
      ...campos,
      formato,
      imagem_url,
      autor_email: email,
      autor_nome: sessao?.nome ?? null,
      autor_usuario: sessao?.usuario && sessao.usuario !== "-" ? sessao.usuario : null,
    });
  } catch (e) {
    falhou(volta, e);
  }
  const extra = await depoisDePost(
    form,
    { id, titulo: campos.titulo, corpo: campos.corpo, publicado: campos.publicado, imagem: imagem_url, formato, novo: true },
    email,
  );
  limpar(volta);
  revalidatePath("/painel/novidades");
  voltar(volta, "ok", (campos.publicado ? "Postagem publicada." : "Rascunho salvo.") + extra);
}

export async function salvarPost(form: FormData) {
  const email = await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  const campos = lerPost(form, volta);
  const imagem_url = await resolverImagem(form, "posts", volta, await imagemAtual("posts", id));
  const formato = imagem_url ? campos.formato ?? "quadrada" : null;
  try {
    const { error } = await supabaseAdmin().from("posts").update({ ...campos, formato, imagem_url }).eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(volta, e);
  }
  const extra = await depoisDePost(
    form,
    { id, titulo: campos.titulo, corpo: campos.corpo, publicado: campos.publicado, imagem: imagem_url, formato, novo: false },
    email,
  );
  limpar(volta);
  revalidatePath("/painel/novidades");
  revalidatePath(`/painel/novidades/${id}`);
  voltar(volta, "ok", "Postagem salva." + extra);
}

/** Fixa ou desafixa no topo das Novidades (menu dos 3 pontinhos). */
export async function fixarPost(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form, "/painel/novidades");
  const id = txt(form, "id", 40);
  const fixar = txt(form, "fixar", 2) === "1";
  try {
    const { error } = await supabaseAdmin().from("posts").update({ fixado: fixar }).eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(volta, e);
  }
  emitirDepois({ t: "atualizou" });
  limpar(volta);
  revalidatePath("/painel/novidades");
  voltar(volta, "ok", fixar ? "Postagem fixada no topo." : "Postagem desafixada.");
}

/** Liga ou desliga o aviso de uma postagem (menu dos 3 pontinhos). */
export async function alternarAvisoPost(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form, "/painel/novidades");
  const id = txt(form, "id", 40);
  const ligar = txt(form, "ligar", 2) === "1";
  const db = supabaseAdmin();
  let msg = "";
  try {
    if (!ligar) {
      await db.from("avisos").delete().eq("post_id", id);
      msg = "Aviso removido do Início.";
    } else {
      const { data } = await db.from("posts").select("titulo,corpo,imagem_url,formato,publicado").eq("id", id).maybeSingle();
      const p = data as { titulo: string; corpo: string; imagem_url: string | null; formato: string | null; publicado: boolean } | null;
      if (!p || !p.publicado) voltar(volta, "erro", "Publique a postagem antes de transformá-la em aviso.");
      const f = new FormData();
      f.set("virar_aviso", "on");
      f.set("aviso_tipo", "importante");
      f.set("aviso_dias", "1");
      await sincronizarAviso(f, { id, titulo: p!.titulo, corpo: p!.corpo, publicado: true, imagem: p!.imagem_url, formato: p!.formato });
      msg = "Postagem virou aviso no Início (por 24 horas).";
      emitirDepois({ t: "aviso" });
    }
  } catch (e) {
    falhou(volta, e);
  }
  limpar(volta);
  voltar(volta, "ok", msg);
}

export async function excluirPost(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  try {
    await apagarImagem(await imagemAtual("posts", id));
    await supabaseAdmin().from("notificacoes").delete().eq("ref_id", id);
    const { error } = await supabaseAdmin().from("posts").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(volta, e);
  }
  emitirDepois({ t: "atualizou" });
  limpar(volta);
  revalidatePath("/painel/novidades");
  // se a pessoa estava dentro da própria postagem, volta para a lista
  voltar(volta.startsWith("/painel/novidades/") ? "/painel/novidades" : volta, "ok", "Postagem excluída.");
}

// ---------------- Comunicado manual ----------------

const NOTIFS = "/painel/admin/notificacoes";

export async function enviarComunicado(form: FormData) {
  const email = await exigirAdmin();
  const titulo = txt(form, "titulo", 120);
  const texto = txt(form, "texto", 180);
  const linkBruto = String(form.get("link") ?? "").trim();
  const link = linkBruto ? urlOk(linkBruto) : null;
  if (!titulo) voltar(NOTIFS, "erro", "Escreva o título da notificação.");
  if (linkBruto && !link) voltar(NOTIFS, "erro", "Confira o link (ex.: https://site.com ou /painel/novidades).");
  let msg = "Notificação enviada no sino.";
  try {
    const r = await notificarTodos({ tipo: "manual", titulo, texto, link: link ?? "/painel", autorEmail: email });
    if (!r.ok) falhou(NOTIFS, new Error(r.erro ?? ""));
    emitirDepois({ t: "notificacao" });
    msg = r.semPush
      ? "Notificação enviada no sino (o push ainda não está configurado)."
      : `Notificação enviada no sino e por push para ${r.push} aparelho(s).`;
  } catch (e) {
    falhou(NOTIFS, e);
  }
  limpar(NOTIFS);
  voltar(NOTIFS, "ok", msg);
}
