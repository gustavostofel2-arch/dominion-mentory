import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GRUPOS, MAPA_ESTUDOS_URL } from "@/lib/conteudo";

export type Cor = "op" | "calc" | "ia" | "aula";
export type Item = {
  id: string;
  moduloId: string;
  titulo: string;
  descricao: string;
  tag: string;
  icone: string;
  url: string;
  destaque: boolean;
  ordem: number;
  visivel: boolean;
};
export type Modulo = { id: string; titulo: string; cor: Cor; ordem: number; visivel: boolean; itens: Item[] };

export type TipoAviso = "info" | "importante" | "urgente";
export type Aviso = {
  id: string;
  titulo: string;
  texto: string;
  tipo: TipoAviso;
  linkUrl: string | null;
  linkTexto: string | null;
  imagemUrl: string | null;
  ativo: boolean;
  expiraEm: string | null;
  criadoEm: string;
};

/** Conteúdo de reserva: usado se as tabelas ainda não existem ou estão vazias. */
function reserva(): Modulo[] {
  const inicio: Modulo = {
    id: "reserva-inicio",
    titulo: "Início",
    cor: "aula",
    ordem: 0,
    visivel: true,
    itens: [
      {
        id: "reserva-mapa",
        moduloId: "reserva-inicio",
        titulo: "Mapa de Estudos",
        descricao: "Por onde eu começo? Todo mundo parte do mesmo ponto e a rota muda conforme o seu nível.",
        tag: "Comece aqui",
        icone: "layers",
        url: MAPA_ESTUDOS_URL,
        destaque: true,
        ordem: 10,
        visivel: true,
      },
    ],
  };
  const grupos: Modulo[] = GRUPOS.map((g, gi) => ({
    id: `reserva-${gi}`,
    titulo: g.titulo,
    cor: g.classe,
    ordem: (gi + 1) * 10,
    visivel: true,
    itens: g.itens.map((it, ii) => ({
      id: `reserva-${gi}-${ii}`,
      moduloId: `reserva-${gi}`,
      titulo: it.nome,
      descricao: it.texto,
      tag: it.tag,
      icone: it.icone,
      url: it.url,
      destaque: false,
      ordem: (ii + 1) * 10,
      visivel: true,
    })),
  }));
  return [inicio, ...grupos];
}

type LinhaModulo = { id: string; titulo: string; cor: Cor; ordem: number; visivel: boolean };
type LinhaItem = {
  id: string;
  modulo_id: string;
  titulo: string;
  descricao: string;
  tag: string;
  icone: string;
  url: string;
  destaque: boolean;
  ordem: number;
  visivel: boolean;
};

/** Lê tudo (inclusive escondidos). O painel filtra; o Admin mostra tudo. */
export async function lerCatalogoCompleto(): Promise<{ modulos: Modulo[]; doBanco: boolean }> {
  try {
    const db = supabaseAdmin();
    const [m, i] = await Promise.all([
      db.from("modulos").select("id,titulo,cor,ordem,visivel").order("ordem"),
      db.from("itens").select("id,modulo_id,titulo,descricao,tag,icone,url,destaque,ordem,visivel").order("ordem"),
    ]);
    if (m.error || i.error) throw m.error ?? i.error;
    const mods = (m.data ?? []) as LinhaModulo[];
    if (!mods.length) return { modulos: reserva(), doBanco: false };
    const itens = (i.data ?? []) as LinhaItem[];
    const modulos: Modulo[] = mods.map((x) => ({
      ...x,
      itens: itens
        .filter((it) => it.modulo_id === x.id)
        .map((it) => ({
          id: it.id,
          moduloId: it.modulo_id,
          titulo: it.titulo,
          descricao: it.descricao,
          tag: it.tag,
          icone: it.icone,
          url: it.url,
          destaque: it.destaque,
          ordem: it.ordem,
          visivel: it.visivel,
        })),
    }));
    return { modulos, doBanco: true };
  } catch {
    return { modulos: reserva(), doBanco: false };
  }
}

/** O que o aluno vê: sem módulos nem ferramentas escondidos. Em cache; o Admin limpa ao salvar. */
export const carregarCatalogo = unstable_cache(
  async (): Promise<Modulo[]> => {
    const { modulos } = await lerCatalogoCompleto();
    return modulos
      .filter((m) => m.visivel)
      .map((m) => ({ ...m, itens: m.itens.filter((it) => it.visivel) }))
      .filter((m) => m.itens.length > 0);
  },
  ["catalogo-v1"],
  { tags: ["catalogo"], revalidate: 300 },
);

type LinhaAviso = {
  id: string;
  titulo: string;
  texto: string;
  tipo: TipoAviso;
  link_url: string | null;
  link_texto: string | null;
  imagem_url: string | null;
  ativo: boolean;
  expira_em: string | null;
  criado_em: string;
};

function paraAviso(a: LinhaAviso): Aviso {
  return {
    id: a.id,
    titulo: a.titulo,
    texto: a.texto,
    tipo: a.tipo,
    linkUrl: a.link_url,
    linkTexto: a.link_texto,
    imagemUrl: a.imagem_url ?? null,
    ativo: a.ativo,
    expiraEm: a.expira_em,
    criadoEm: a.criado_em,
  };
}

/** Todos os avisos, para o Admin. */
export async function lerAvisosAdmin(): Promise<Aviso[]> {
  try {
    const { data, error } = await supabaseAdmin().from("avisos").select("*").order("criado_em", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as LinhaAviso[]).map(paraAviso);
  } catch {
    return [];
  }
}

const avisosAtivos = unstable_cache(
  async (): Promise<Aviso[]> => {
    try {
      const { data, error } = await supabaseAdmin().from("avisos").select("*").eq("ativo", true).order("criado_em", { ascending: false }).limit(20);
      if (error) throw error;
      return ((data ?? []) as LinhaAviso[]).map(paraAviso);
    } catch {
      return [];
    }
  },
  ["avisos-v2"],
  { tags: ["avisos"], revalidate: 60 },
);

/** Avisos ativos e não vencidos. A validade é conferida a cada acesso (fora do cache), então vencer vale na hora. */
export async function carregarAvisos(): Promise<Aviso[]> {
  const lista = await avisosAtivos();
  const agora = Date.now();
  return lista.filter((a) => !a.expiraEm || new Date(a.expiraEm).getTime() > agora).slice(0, 10);
}
