import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { comPadrao, ehTipo, type Dados, type TipoBloco } from "@/lib/blocos";
import { PAGINAS_PADRAO } from "@/lib/paginas-padrao";

export type Bloco = { id: string; paginaId: string; tipo: TipoBloco; dados: Dados; ordem: number; visivel: boolean };

export type Pagina = {
  id: string;
  slug: string;
  titulo: string;
  menuRotulo: string | null;
  etiqueta: string | null;
  descricao: string | null;
  icone: string;
  noMenu: boolean;
  visivel: boolean;
  mostrarCabecalho: boolean;
  protegida: boolean;
  ordem: number;
  blocos: Bloco[];
};

export type Painel = { paginas: Pagina[]; doBanco: boolean };

/** Slugs que não podem ser usados por páginas (já são rotas do sistema). */
export const SLUGS_RESERVADOS = new Set(["admin", "notificacoes", "novidades-post", "p", "api", "bem-vindo", "login"]);

/** Páginas embutidas no código, usadas enquanto as tabelas não existem. */
function reserva(): Pagina[] {
  return PAGINAS_PADRAO.map((p, i) => {
    const id = `padrao-${p.slug}`;
    return {
      id,
      slug: p.slug,
      titulo: p.titulo,
      menuRotulo: p.menu_rotulo ?? null,
      etiqueta: p.etiqueta ?? null,
      descricao: p.descricao ?? null,
      icone: p.icone,
      noMenu: p.no_menu,
      visivel: p.visivel,
      mostrarCabecalho: p.mostrar_cabecalho,
      protegida: p.protegida,
      ordem: p.ordem ?? i,
      blocos: p.blocos.map((b, k) => ({
        id: `${id}-${k}`,
        paginaId: id,
        tipo: b.tipo,
        dados: comPadrao(b.tipo, b.dados),
        ordem: (k + 1) * 10,
        visivel: true,
      })),
    };
  });
}

type LinhaPagina = {
  id: string;
  slug: string;
  titulo: string;
  menu_rotulo: string | null;
  etiqueta: string | null;
  descricao: string | null;
  icone: string;
  no_menu: boolean;
  visivel: boolean;
  mostrar_cabecalho: boolean;
  protegida: boolean;
  ordem: number;
};
type LinhaBloco = { id: string; pagina_id: string; tipo: string; dados: Dados; ordem: number; visivel: boolean };

/**
 * Grava as páginas padrão quando a tabela está vazia (primeira visita depois do SQL).
 * Cada passo é uma única gravação (tudo ou nada), para duas visitas ao mesmo tempo não deixarem páginas pela metade.
 */
async function semear() {
  const db = supabaseAdmin();
  const ins = await db
    .from("paginas")
    .insert(
      PAGINAS_PADRAO.map((p) => ({
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
      })),
    )
    .select("id,slug");
  if (ins.error || !ins.data) return; // outra visita já semeou ao mesmo tempo
  const idPorSlug = new Map((ins.data as { id: string; slug: string }[]).map((r) => [r.slug, r.id]));
  const linhas = PAGINAS_PADRAO.flatMap((p) =>
    p.blocos.map((b, k) => ({ pagina_id: idPorSlug.get(p.slug), tipo: b.tipo, dados: b.dados, ordem: (k + 1) * 10 })),
  );
  await db.from("blocos").insert(linhas);
}

async function lerBanco(): Promise<Painel> {
  try {
    const db = supabaseAdmin();
    let pg = await db.from("paginas").select("*").order("ordem").order("criado_em");
    if (pg.error) throw pg.error;
    if (!pg.data?.length) {
      await semear();
      pg = await db.from("paginas").select("*").order("ordem").order("criado_em");
      if (pg.error) throw pg.error;
    }
    const bl = await db.from("blocos").select("id,pagina_id,tipo,dados,ordem,visivel").order("ordem").order("criado_em");
    if (bl.error) throw bl.error;
    const blocos = ((bl.data ?? []) as LinhaBloco[]).filter((b) => ehTipo(b.tipo));
    const paginas: Pagina[] = ((pg.data ?? []) as LinhaPagina[]).map((p) => ({
      id: p.id,
      slug: p.slug,
      titulo: p.titulo,
      menuRotulo: p.menu_rotulo,
      etiqueta: p.etiqueta,
      descricao: p.descricao,
      icone: p.icone,
      noMenu: p.no_menu,
      visivel: p.visivel,
      mostrarCabecalho: p.mostrar_cabecalho,
      protegida: p.protegida,
      ordem: p.ordem,
      blocos: blocos
        .filter((b) => b.pagina_id === p.id)
        .map((b) => ({ id: b.id, paginaId: b.pagina_id, tipo: b.tipo as TipoBloco, dados: comPadrao(b.tipo as TipoBloco, b.dados), ordem: b.ordem, visivel: b.visivel })),
    }));
    return { paginas, doBanco: true };
  } catch (e) {
    console.error("[paginas] usando as páginas padrão do código:", (e as { message?: string } | null)?.message ?? e);
    return { paginas: reserva(), doBanco: false };
  }
}

const emCache = unstable_cache(
  async () => {
    const r = await lerBanco();
    // não guarda no cache a situação "sem tabelas": assim, logo depois de rodar o SQL, o site já enxerga o banco
    // (também não guarda se ainda não há nenhum bloco: a criação inicial pode estar acontecendo agora)
    if (!r.doBanco || r.paginas.every((p) => p.blocos.length === 0)) throw new Error("incompleto");
    return r;
  },
  ["painel-v2"],
  { tags: ["paginas"], revalidate: 300 },
);

/** Todas as páginas com os blocos. Em cache; o Admin limpa a tag "paginas" ao salvar. */
export async function carregarPainel(): Promise<Painel> {
  try {
    return await emCache();
  } catch {
    return lerBanco();
  }
}

/** A página padrão embutida no código (usada se o banco ainda não devolveu a página). */
export function paginaReserva(slug: string): Pagina | null {
  return reserva().find((p) => p.slug === slug) ?? null;
}

export async function paginaPorSlug(slug: string): Promise<{ pagina: Pagina | null; doBanco: boolean }> {
  let { paginas, doBanco } = await carregarPainel();
  // lista vazia logo depois da criação inicial: lê de novo direto do banco, sem cache
  if (doBanco && paginas.length === 0) ({ paginas, doBanco } = await lerBanco());
  return { pagina: paginas.find((p) => p.slug === slug) ?? null, doBanco };
}

export const rotuloMenu = (p: Pagina) => p.menuRotulo?.trim() || p.titulo;
