import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Formato = "quadrada" | "retrato" | "banner";
export type TipoAviso = "info" | "importante" | "urgente";

export type Post = {
  id: string;
  titulo: string;
  corpo: string;
  imagemUrl: string | null;
  formato: Formato | null;
  fixado: boolean;
  publicado: boolean;
  autorNome: string | null;
  autorUsuario: string | null;
  criadoEm: string;
  curtidas: number;
  comentarios: number;
  euCurti: boolean;
  /** Se a postagem também está nos avisos do Início, com qual destaque. */
  avisoTipo: TipoAviso | null;
};

export type Comentario = {
  id: string;
  email: string;
  nome: string | null;
  usuario: string | null;
  texto: string;
  criadoEm: string;
  parentId: string | null;
};

type LinhaPost = {
  id: string;
  titulo: string;
  corpo: string;
  imagem_url: string | null;
  formato: Formato | null;
  fixado: boolean;
  publicado: boolean;
  autor_nome: string | null;
  autor_usuario?: string | null;
  criado_em: string;
  curtidas?: number | string;
  comentarios?: number | string;
  eu_curti?: boolean;
  aviso_tipo?: TipoAviso | null;
};

const COLUNAS_BASE = "id,titulo,corpo,imagem_url,formato,fixado,publicado,autor_nome,criado_em";

function paraPost(l: LinhaPost, extra?: Partial<Post>): Post {
  return {
    id: l.id,
    titulo: l.titulo,
    corpo: l.corpo,
    imagemUrl: l.imagem_url,
    formato: l.formato,
    fixado: l.fixado,
    publicado: l.publicado,
    autorNome: l.autor_nome,
    autorUsuario: l.autor_usuario ?? null,
    criadoEm: l.criado_em,
    curtidas: Number(l.curtidas ?? 0),
    comentarios: Number(l.comentarios ?? 0),
    euCurti: !!l.eu_curti,
    avisoTipo: l.aviso_tipo ?? null,
    ...extra,
  };
}

type Opcoes = { email: string | null; limite?: number; soFixados?: boolean; fixadosPrimeiro?: boolean; rascunhos?: boolean };

/** Caminho antigo (várias consultas): só usado se a função do banco da etapa 4 ainda não existe. */
async function listarLegado(o: Opcoes): Promise<Post[]> {
  const db = supabaseAdmin();
  let q = db.from("posts").select(COLUNAS_BASE);
  if (!o.rascunhos) q = q.eq("publicado", true);
  if (o.soFixados) q = q.eq("fixado", true);
  if (o.fixadosPrimeiro !== false) q = q.order("fixado", { ascending: false });
  const { data, error } = await q.order("criado_em", { ascending: false }).limit(o.limite ?? 30);
  if (error) throw error;
  const linhas = (data ?? []) as LinhaPost[];
  if (!linhas.length) return [];
  const ids = linhas.map((l) => l.id);
  const [c, m] = await Promise.all([
    db.from("curtidas").select("post_id,email").in("post_id", ids),
    db.from("comentarios").select("post_id").in("post_id", ids),
  ]);
  const curtidas = new Map<string, number>();
  const minhas = new Set<string>();
  for (const r of (c.data ?? []) as { post_id: string; email: string }[]) {
    curtidas.set(r.post_id, (curtidas.get(r.post_id) ?? 0) + 1);
    if (o.email && r.email === o.email) minhas.add(r.post_id);
  }
  const coment = new Map<string, number>();
  for (const r of (m.data ?? []) as { post_id: string }[]) coment.set(r.post_id, (coment.get(r.post_id) ?? 0) + 1);
  return linhas.map((l) => paraPost(l, { curtidas: curtidas.get(l.id) ?? 0, comentarios: coment.get(l.id) ?? 0, euCurti: minhas.has(l.id) }));
}

/** Feed em uma única ida ao banco (função feed_posts). */
export async function listarFeed(o: Opcoes): Promise<Post[]> {
  try {
    const { data, error } = await supabaseAdmin().rpc("feed_posts", {
      p_email: o.email ?? "",
      p_limite: o.limite ?? 30,
      p_so_fixados: !!o.soFixados,
      p_fixados_primeiro: o.fixadosPrimeiro !== false,
      p_rascunhos: !!o.rascunhos,
    });
    if (error) throw error;
    return ((data ?? []) as LinhaPost[]).map((l) => paraPost(l));
  } catch {
    try {
      return await listarLegado(o);
    } catch {
      return [];
    }
  }
}

/** Posts publicados: fixados primeiro, depois os mais novos. */
export function listarPosts(opts: { email: string | null; limite?: number; soFixados?: boolean }): Promise<Post[]> {
  return listarFeed({ ...opts, fixadosPrimeiro: true });
}

/** Mais recentes primeiro, sem dar prioridade a fixados (para o Início). */
export function ultimosPosts(email: string | null, limite = 3): Promise<Post[]> {
  return listarFeed({ email, limite, fixadosPrimeiro: false });
}

/** Todos os posts (inclusive rascunhos), para o Admin. */
export function listarPostsAdmin(): Promise<Post[]> {
  return listarFeed({ email: null, limite: 100, fixadosPrimeiro: false, rascunhos: true });
}

export async function lerPost(id: string, email: string | null, incluirRascunho = false): Promise<Post | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const db = supabaseAdmin();
    const [pr, cu, co, av] = await Promise.all([
      db.from("posts").select("*").eq("id", id).maybeSingle(),
      db.from("curtidas").select("email").eq("post_id", id),
      db.from("comentarios").select("id", { count: "exact", head: true }).eq("post_id", id),
      db.from("avisos").select("tipo").eq("post_id", id).maybeSingle(),
    ]);
    if (pr.error || !pr.data) return null;
    const l = pr.data as LinhaPost;
    if (!l.publicado && !incluirRascunho) return null;
    const lista = (cu.data ?? []) as { email: string }[];
    return paraPost(l, {
      curtidas: lista.length,
      comentarios: co.count ?? 0,
      euCurti: !!email && lista.some((x) => x.email === email),
      avisoTipo: ((av.data as { tipo?: TipoAviso } | null)?.tipo ?? null) as TipoAviso | null,
    });
  } catch {
    return null;
  }
}

type LinhaComentario = {
  id: string;
  email: string;
  nome: string | null;
  usuario?: string | null;
  texto: string;
  criado_em: string;
  parent_id?: string | null;
};

export async function lerComentarios(postId: string): Promise<Comentario[]> {
  try {
    const db = supabaseAdmin();
    let dados: unknown[] | null;
    const r1 = await db
      .from("comentarios")
      .select("id,email,nome,usuario,texto,criado_em,parent_id")
      .eq("post_id", postId)
      .order("criado_em")
      .limit(500);
    if (!r1.error) dados = r1.data;
    else {
      // etapa 4 ainda não rodou: lê só as colunas antigas
      const r2 = await db.from("comentarios").select("id,email,nome,texto,criado_em").eq("post_id", postId).order("criado_em").limit(500);
      if (r2.error) throw r2.error;
      dados = r2.data;
    }
    return ((dados ?? []) as LinhaComentario[]).map((c) => ({
      id: c.id,
      email: c.email,
      nome: c.nome,
      usuario: c.usuario ?? null,
      texto: c.texto,
      criadoEm: c.criado_em,
      parentId: c.parent_id ?? null,
    }));
  } catch {
    return [];
  }
}

/** Títulos recentes para a busca do topo (cache curto). */
export const titulosParaBusca = unstable_cache(
  async (): Promise<{ id: string; titulo: string }[]> => {
    try {
      const { data, error } = await supabaseAdmin()
        .from("posts")
        .select("id,titulo")
        .eq("publicado", true)
        .order("criado_em", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as { id: string; titulo: string }[];
    } catch {
      return [];
    }
  },
  ["posts-busca-v1"],
  { tags: ["posts"], revalidate: 120 },
);

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PROPORCAO: Record<Formato, string> = { quadrada: "1 / 1", retrato: "1080 / 1320", banner: "16 / 9" };
