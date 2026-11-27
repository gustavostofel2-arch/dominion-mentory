"use server";

import { cookies } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BLOCOS, ICONES_PAGINA, ehTipo, normalizarDados, type Dados, type TipoBloco } from "@/lib/blocos";
import { PAGINAS_PADRAO } from "@/lib/paginas-padrao";
import { SLUGS_RESERVADOS } from "@/lib/paginas";
import { apagarImagem, enviarImagem } from "@/lib/storage";
import { COOKIE_EDICAO } from "@/lib/edicao";
import { emitir } from "@/lib/tempo-real";

const ADMIN_PAGINAS = "/painel/admin/paginas";
const UUID = /^[0-9a-f-]{36}$/i;

function txt(form: FormData, nome: string, max: number): string {
  return String(form.get(nome) ?? "").trim().slice(0, max);
}
const marcado = (form: FormData, nome: string) => form.get(nome) === "on";

const caminhoDe = (slug: string) => (slug === "inicio" ? "/painel" : `/painel/${slug}`);

/** Só caminhos do painel (evita redirecionar para outro site). */
function retornoDe(form: FormData, padrao = ADMIN_PAGINAS): string {
  const r = String(form.get("retorno") ?? "").split("?")[0];
  return r.startsWith("/painel") && !r.startsWith("//") && !/\s/.test(r) ? r : padrao;
}

function ir(path: string, tipo: "ok" | "erro", msg: string, extra = ""): never {
  // o carimbo (_=) garante que o endereço seja sempre novo: redirecionar para o mesmo endereço deixava a tela em branco
  const carimbo = Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  const q = [extra, `${tipo}=${encodeURIComponent(msg)}`, `_=${carimbo}`].filter(Boolean).join("&");
  redirect(`${path}?${q}`);
}

/** O modo edição fica num cookie (com o endereço da página sendo editada), não na URL. */
async function definirEdicao(path: string | null) {
  const jar = await cookies();
  if (!path) return jar.delete(COOKIE_EDICAO);
  jar.set(COOKIE_EDICAO, path, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
}

/** Liga ou desliga o modo edição da página. */
export async function alternarEdicao(form: FormData) {
  await exigirAdmin();
  const destino = String(form.get("destino") ?? form.get("retorno") ?? "");
  const caminho = destino.split("?")[0];
  const ok = caminho.startsWith("/painel") && !caminho.startsWith("//") && !/\s/.test(caminho);
  if (!ok) redirect("/painel");
  const ligar = String(form.get("ligar") ?? "") === "1";
  await definirEdicao(ligar ? caminho : null);
  revalidatePath(caminho);
  ir(caminho, "ok", ligar ? "Modo edição ligado." : "Edição concluída.");
}

function limparTudo() {
  revalidateTag("paginas");
  revalidatePath("/painel", "layout");
}

function falhou(path: string, e: unknown): never {
  unstable_rethrow(e); // um redirect lançado dentro de try não é erro: deixa passar
  const m = (e as { message?: string } | null)?.message ?? "";
  if (/does not exist|schema cache|could not find|relation/i.test(m)) {
    ir(path, "erro", "As tabelas de páginas ainda não existem no Supabase. Rode o arquivo supabase/comunidade-etapa5.sql no SQL Editor.");
  }
  ir(path, "erro", "Não foi possível salvar agora. Tente de novo.");
}

function avisar() {
  after(() => emitir({ t: "atualizou" }));
}

function slugify(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

// ------------------------------------------------------------------ imagens

export async function enviarImagemBloco(form: FormData): Promise<{ ok: boolean; url?: string; erro?: string }> {
  await exigirAdmin();
  try {
    const url = await enviarImagem(form.get("imagem"), "blocos");
    if (!url) return { ok: false, erro: "Nenhuma imagem recebida." };
    return { ok: true, url };
  } catch (e) {
    const m = (e as { message?: string } | null)?.message ?? "";
    if (/bucket not found/i.test(m)) return { ok: false, erro: "A pasta de imagens não existe. Rode o SQL da etapa 2." };
    return { ok: false, erro: m && m.length < 120 ? m : "Não foi possível enviar a imagem." };
  }
}

// ------------------------------------------------------------------ blocos

async function reordenar(paginaId: string, ids: string[]) {
  const db = supabaseAdmin();
  for (let i = 0; i < ids.length; i++) {
    const { error } = await db.from("blocos").update({ ordem: (i + 1) * 10 }).eq("id", ids[i]);
    if (error) throw error;
  }
  void paginaId;
}

async function idsDaPagina(paginaId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin().from("blocos").select("id").eq("pagina_id", paginaId).order("ordem").order("criado_em");
  if (error) throw error;
  return ((data ?? []) as { id: string }[]).map((r) => r.id);
}

/** Cria um bloco novo logo depois de "depois" (id de outro bloco) ou no fim/início. */
export async function adicionarBloco(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const paginaId = txt(form, "pagina_id", 40);
  const tipo = txt(form, "tipo", 30);
  const depois = txt(form, "depois", 40); // id do bloco anterior, "inicio" ou ""
  if (!UUID.test(paginaId) || !ehTipo(tipo)) ir(volta, "erro", "Não consegui adicionar o bloco.");
  let novoId = "";
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("blocos")
      .insert({ pagina_id: paginaId, tipo, dados: BLOCOS[tipo as TipoBloco].padrao, ordem: 999999 })
      .select("id")
      .single();
    if (error) throw error;
    novoId = (data as { id: string }).id;
    const ids = (await idsDaPagina(paginaId)).filter((i) => i !== novoId);
    const pos = depois === "inicio" ? 0 : UUID.test(depois) ? ids.indexOf(depois) + 1 : ids.length;
    ids.splice(Math.max(0, pos), 0, novoId);
    await reordenar(paginaId, ids);
  } catch (e) {
    falhou(volta, e);
  }
  limparTudo();
  avisar();
  ir(volta, "ok", "Bloco adicionado. Preencha os campos e salve.", `novo=${novoId}`);
}

export async function salvarBloco(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  if (!UUID.test(id)) ir(volta, "erro", "Bloco não encontrado.");
  let dadosBrutos: unknown = {};
  try {
    const bruto = String(form.get("dados") ?? "");
    if (bruto.length > 400000) ir(volta, "erro", "Os dados do bloco estão grandes demais.");
    dadosBrutos = JSON.parse(bruto);
  } catch {
    ir(volta, "erro", "Não consegui ler os dados do bloco. Recarregue a página e tente de novo.");
  }
  try {
    const db = supabaseAdmin();
    const { data, error } = await db.from("blocos").select("tipo").eq("id", id).maybeSingle();
    if (error) throw error;
    const tipo = (data as { tipo?: string } | null)?.tipo;
    if (!tipo || !ehTipo(tipo)) ir(volta, "erro", "Bloco não encontrado.");
    const dados: Dados = normalizarDados(tipo as TipoBloco, dadosBrutos);
    const r = await db.from("blocos").update({ dados }).eq("id", id);
    if (r.error) throw r.error;
  } catch (e) {
    falhou(volta, e);
  }
  limparTudo();
  avisar();
  ir(volta, "ok", "Bloco salvo.");
}

export async function moverBloco(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  const dir = txt(form, "dir", 4);
  try {
    const { data } = await supabaseAdmin().from("blocos").select("pagina_id").eq("id", id).maybeSingle();
    const paginaId = (data as { pagina_id?: string } | null)?.pagina_id;
    if (!paginaId) ir(volta, "erro", "Bloco não encontrado.");
    const ids = await idsDaPagina(paginaId!);
    const i = ids.indexOf(id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < ids.length) {
      [ids[i], ids[j]] = [ids[j], ids[i]];
      await reordenar(paginaId!, ids);
    }
  } catch (e) {
    falhou(volta, e);
  }
  limparTudo();
  avisar();
  ir(volta, "ok", "Bloco movido.");
}

export async function duplicarBloco(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  let novoId = "";
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("blocos").select("pagina_id,tipo,dados,visivel").eq("id", id).maybeSingle();
    const b = data as { pagina_id: string; tipo: string; dados: Dados; visivel: boolean } | null;
    if (!b) ir(volta, "erro", "Bloco não encontrado.");
    const ins = await db.from("blocos").insert({ pagina_id: b!.pagina_id, tipo: b!.tipo, dados: b!.dados, visivel: b!.visivel, ordem: 999999 }).select("id").single();
    if (ins.error) throw ins.error;
    novoId = (ins.data as { id: string }).id;
    const ids = (await idsDaPagina(b!.pagina_id)).filter((x) => x !== novoId);
    ids.splice(ids.indexOf(id) + 1, 0, novoId);
    await reordenar(b!.pagina_id, ids);
  } catch (e) {
    falhou(volta, e);
  }
  limparTudo();
  avisar();
  ir(volta, "ok", "Bloco duplicado.");
}

export async function alternarBloco(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  const mostrar = txt(form, "mostrar", 2) === "1";
  try {
    const { error } = await supabaseAdmin().from("blocos").update({ visivel: mostrar }).eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(volta, e);
  }
  limparTudo();
  avisar();
  ir(volta, "ok", mostrar ? "Bloco visível para os alunos." : "Bloco oculto (só você vê no modo edição).");
}

export async function excluirBloco(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  try {
    const { error } = await supabaseAdmin().from("blocos").delete().eq("id", id);
    if (error) throw error;
  } catch (e) {
    falhou(volta, e);
  }
  limparTudo();
  avisar();
  ir(volta, "ok", "Bloco excluído.");
}

// ------------------------------------------------------------------ páginas

const MODELOS: Record<string, TipoBloco[]> = {
  branco: [],
  texto: ["texto"],
  faq: ["faq"],
  ferramentas: ["ferramentas"],
  cartoes: ["cartoes"],
  imagem_texto: ["imagem_texto"],
  feed: ["feed"],
};

async function slugLivre(base: string, ignorarId?: string): Promise<string> {
  const db = supabaseAdmin();
  const raiz = base || "pagina";
  for (let n = 1; n < 50; n++) {
    const tentativa = n === 1 ? raiz : `${raiz.slice(0, 36)}-${n}`;
    if (SLUGS_RESERVADOS.has(tentativa)) continue;
    const { data } = await db.from("paginas").select("id").eq("slug", tentativa).maybeSingle();
    const achada = data as { id: string } | null;
    if (!achada || achada.id === ignorarId) return tentativa;
  }
  return `${raiz.slice(0, 30)}-${Date.now() % 100000}`;
}

function iconeOk(v: string) {
  return (ICONES_PAGINA as readonly string[]).includes(v) ? v : "grid";
}

export async function criarPagina(form: FormData) {
  await exigirAdmin();
  const titulo = txt(form, "titulo", 80);
  if (!titulo) ir(ADMIN_PAGINAS, "erro", "Dê um nome à página.");
  const modelo = txt(form, "modelo", 20);
  let slug = "";
  try {
    const db = supabaseAdmin();
    slug = await slugLivre(slugify(txt(form, "slug", 60) || titulo));
    const { data: ult } = await db.from("paginas").select("ordem").order("ordem", { ascending: false }).limit(1);
    const ordem = ((ult?.[0] as { ordem?: number } | undefined)?.ordem ?? 0) + 10;
    let criada: { id: string } | null = null;
    for (let tentativa = 0; tentativa < 5 && !criada; tentativa++) {
      const r = await db
        .from("paginas")
        .insert({ slug, titulo, icone: iconeOk(txt(form, "icone", 20)), ordem, etiqueta: null, descricao: null })
        .select("id")
        .single();
      if (!r.error) criada = r.data as { id: string };
      else if (r.error.code === "23505") slug = await slugLivre(`${slugify(txt(form, "slug", 60) || titulo) || "pagina"}-${Math.floor(Math.random() * 9000) + 1000}`);
      else throw r.error;
    }
    if (!criada) throw new Error("não foi possível reservar um endereço");
    const id = criada.id;
    const tipos = MODELOS[modelo] ?? [];
    if (tipos.length) {
      const r = await db.from("blocos").insert(tipos.map((t, i) => ({ pagina_id: id, tipo: t, dados: BLOCOS[t].padrao, ordem: (i + 1) * 10 })));
      if (r.error) throw r.error;
    }
  } catch (e) {
    falhou(ADMIN_PAGINAS, e);
  }
  limparTudo();
  avisar();
  await definirEdicao(caminhoDe(slug));
  ir(caminhoDe(slug), "ok", "Página criada. Adicione blocos para montar o conteúdo.");
}

export async function salvarPagina(form: FormData) {
  await exigirAdmin();
  const volta = retornoDe(form);
  const id = txt(form, "id", 40);
  const titulo = txt(form, "titulo", 80);
  if (!UUID.test(id) || !titulo) ir(volta, "erro", "Dê um nome à página.");
  let slugFinal = "";
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("paginas").select("slug,protegida").eq("id", id).maybeSingle();
    const atual = data as { slug: string; protegida: boolean } | null;
    if (!atual) ir(volta, "erro", "Página não encontrada.");
    const campos: Record<string, unknown> = {
      titulo,
      menu_rotulo: txt(form, "menu_rotulo", 40) || null,
      etiqueta: txt(form, "etiqueta", 60) || null,
      descricao: txt(form, "descricao", 400) || null,
      icone: iconeOk(txt(form, "icone", 20)),
      no_menu: marcado(form, "no_menu"),
      mostrar_cabecalho: marcado(form, "mostrar_cabecalho"),
      visivel: atual!.protegida ? true : marcado(form, "visivel"),
    };
    slugFinal = atual!.slug;
    const pedido = slugify(txt(form, "slug", 60));
    if (!atual!.protegida && pedido && pedido !== atual!.slug) {
      if (SLUGS_RESERVADOS.has(pedido)) ir(volta, "erro", `O endereço “${pedido}” é reservado pelo sistema. Escolha outro.`);
      const { data: ocupado } = await db.from("paginas").select("id").eq("slug", pedido).neq("id", id).maybeSingle();
      if (ocupado) ir(volta, "erro", `O endereço “${pedido}” já é de outra página. Escolha outro.`);
      slugFinal = pedido;
      campos.slug = pedido;
    }
    const r = await db.from("paginas").update(campos).eq("id", id);
    if (r.error) throw r.error;
    if (slugFinal !== atual!.slug) await db.from("posts").update({ pagina_slug: slugFinal }).eq("pagina_slug", atual!.slug);
  } catch (e) {
    falhou(volta, e);
  }
  limparTudo();
  avisar();
  // se a página foi renomeada enquanto estava aberta, acompanha o novo endereço
  const novoCaminho = volta.startsWith("/painel/admin") ? volta : caminhoDe(slugFinal);
  ir(novoCaminho, "ok", "Página salva.");
}

export async function moverPagina(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  const dir = txt(form, "dir", 4);
  try {
    const db = supabaseAdmin();
    const { data, error } = await db.from("paginas").select("id").order("ordem").order("criado_em");
    if (error) throw error;
    const ids = ((data ?? []) as { id: string }[]).map((r) => r.id);
    const i = ids.indexOf(id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (i >= 0 && j >= 0 && j < ids.length) {
      [ids[i], ids[j]] = [ids[j], ids[i]];
      for (let k = 0; k < ids.length; k++) {
        const r = await db.from("paginas").update({ ordem: (k + 1) * 10 }).eq("id", ids[k]);
        if (r.error) throw r.error;
      }
    }
  } catch (e) {
    falhou(ADMIN_PAGINAS, e);
  }
  limparTudo();
  avisar();
  ir(ADMIN_PAGINAS, "ok", "Ordem do menu atualizada.");
}

export async function excluirPagina(form: FormData) {
  await exigirAdmin();
  const id = txt(form, "id", 40);
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("paginas").select("protegida,slug").eq("id", id).maybeSingle();
    if ((data as { protegida?: boolean } | null)?.protegida) ir(ADMIN_PAGINAS, "erro", "O Início não pode ser apagado (mas você pode editá-lo).");
    const slug = (data as { slug?: string } | null)?.slug;
    if (slug) {
      // as postagens feitas nessa página vão embora com ela (senão ficariam escondidas, sem lugar)
      const { data: posts } = await db.from("posts").select("id,imagem_url").eq("pagina_slug", slug);
      const lista = (posts ?? []) as { id: string; imagem_url: string | null }[];
      if (lista.length) {
        for (const p of lista) await apagarImagem(p.imagem_url);
        await db.from("notificacoes").delete().in("ref_id", lista.map((p) => p.id));
        await db.from("posts").delete().eq("pagina_slug", slug);
      }
    }
    const r = await db.from("paginas").delete().eq("id", id);
    if (r.error) throw r.error;
  } catch (e) {
    falhou(ADMIN_PAGINAS, e);
  }
  limparTudo();
  avisar();
  ir(ADMIN_PAGINAS, "ok", "Página excluída.");
}

/** Recria as páginas padrão que estiverem faltando (não mexe nas que já existem). */
export async function restaurarPaginasPadrao() {
  await exigirAdmin();
  let criadas = 0;
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("paginas").select("slug");
    const existentes = new Set(((data ?? []) as { slug: string }[]).map((p) => p.slug));
    for (const p of PAGINAS_PADRAO) {
      if (existentes.has(p.slug)) continue;
      const ins = await db
        .from("paginas")
        .insert({
          slug: p.slug,
          titulo: p.titulo,
          menu_rotulo: p.menu_rotulo ?? null,
          etiqueta: p.etiqueta ?? null,
          descricao: p.descricao ?? null,
          icone: p.icone,
          no_menu: p.no_menu,
          visivel: p.visivel,
          mostrar_cabecalho: p.mostrar_cabecalho,
          protegida: p.protegida,
          ordem: p.ordem,
        })
        .select("id")
        .single();
      if (ins.error || !ins.data) continue;
      await db.from("blocos").insert(p.blocos.map((b, k) => ({ pagina_id: (ins.data as { id: string }).id, tipo: b.tipo, dados: b.dados, ordem: (k + 1) * 10 })));
      criadas++;
    }
  } catch (e) {
    falhou(ADMIN_PAGINAS, e);
  }
  limparTudo();
  ir(ADMIN_PAGINAS, "ok", criadas ? `${criadas} página(s) padrão restaurada(s).` : "Todas as páginas padrão já existem.");
}
