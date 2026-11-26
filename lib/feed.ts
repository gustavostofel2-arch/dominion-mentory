import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Formato = "quadrada" | "retrato" | "banner";

export type Post = {
  id: string;
  titulo: string;
  corpo: string;
  imagemUrl: string | null;
  formato: Formato | null;
  fixado: boolean;
  publicado: boolean;
  autorNome: string | null;
  criadoEm: string;
  curtidas: number;
  comentarios: number;
  euCurti: boolean;
};

export type Comentario = { id: string; email: string; nome: string | null; texto: string; criadoEm: string };

type LinhaPost = {
  id: string;
  titulo: string;
  corpo: string;
  imagem_url: string | null;
  formato: Formato | null;
  fixado: boolean;
  publicado: boolean;
  autor_nome: string | null;
  criado_em: string;
};

const COLUNAS = "id,titulo,corpo,imagem_url,formato,fixado,publicado,autor_nome,criado_em";

async function anexarContagens(linhas: LinhaPost[], email: string | null): Promise<Post[]> {
  if (!linhas.length) return [];
  const db = supabaseAdmin();
  const ids = linhas.map((l) => l.id);
  const [c, m] = await Promise.all([
    db.from("curtidas").select("post_id,email").in("post_id", ids),
    db.from("comentarios").select("post_id").in("post_id", ids),
  ]);
  const curtidas = new Map<string, number>();
  const minhas = new Set<string>();
  for (const r of (c.data ?? []) as { post_id: string; email: string }[]) {
    curtidas.set(r.post_id, (curtidas.get(r.post_id) ?? 0) + 1);
    if (email && r.email === email) minhas.add(r.post_id);
  }
  const coment = new Map<string, number>();
  for (const r of (m.data ?? []) as { post_id: string }[]) coment.set(r.post_id, (coment.get(r.post_id) ?? 0) + 1);
  return linhas.map((l) => ({
    id: l.id,
    titulo: l.titulo,
    corpo: l.corpo,
    imagemUrl: l.imagem_url,
    formato: l.formato,
    fixado: l.fixado,
    publicado: l.publicado,
    autorNome: l.autor_nome,
    criadoEm: l.criado_em,
    curtidas: curtidas.get(l.id) ?? 0,
    comentarios: coment.get(l.id) ?? 0,
    euCurti: minhas.has(l.id),
  }));
}

/** Posts publicados: fixados primeiro, depois os mais novos. */
export async function listarPosts(opts: { email: string | null; limite?: number; soFixados?: boolean }): Promise<Post[]> {
  try {
    let q = supabaseAdmin()
      .from("posts")
      .select(COLUNAS)
      .eq("publicado", true)
      .order("fixado", { ascending: false })
      .order("criado_em", { ascending: false })
      .limit(opts.limite ?? 30);
    if (opts.soFixados) q = q.eq("fixado", true);
    const { data, error } = await q;
    if (error) throw error;
    return anexarContagens((data ?? []) as LinhaPost[], opts.email);
  } catch {
    return [];
  }
}

/** Mais recentes primeiro, sem dar prioridade a fixados (para "Últimas novidades"). */
export async function ultimosPosts(email: string | null, limite = 3): Promise<Post[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("posts")
      .select(COLUNAS)
      .eq("publicado", true)
      .order("criado_em", { ascending: false })
      .limit(limite);
    if (error) throw error;
    return anexarContagens((data ?? []) as LinhaPost[], email);
  } catch {
    return [];
  }
}

export async function lerPost(id: string, email: string | null, incluirRascunho = false): Promise<Post | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const { data, error } = await supabaseAdmin().from("posts").select(COLUNAS).eq("id", id).maybeSingle();
    if (error || !data) return null;
    const linha = data as LinhaPost;
    if (!linha.publicado && !incluirRascunho) return null;
    return (await anexarContagens([linha], email))[0] ?? null;
  } catch {
    return null;
  }
}

export async function lerComentarios(postId: string): Promise<Comentario[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("comentarios")
      .select("id,email,nome,texto,criado_em")
      .eq("post_id", postId)
      .order("criado_em")
      .limit(300);
    if (error) throw error;
    return ((data ?? []) as { id: string; email: string; nome: string | null; texto: string; criado_em: string }[]).map((c) => ({
      id: c.id,
      email: c.email,
      nome: c.nome,
      texto: c.texto,
      criadoEm: c.criado_em,
    }));
  } catch {
    return [];
  }
}

/** Todos os posts (inclusive rascunhos), para o Admin. */
export async function listarPostsAdmin(): Promise<Post[]> {
  try {
    const { data, error } = await supabaseAdmin().from("posts").select(COLUNAS).order("criado_em", { ascending: false }).limit(100);
    if (error) throw error;
    return anexarContagens((data ?? []) as LinhaPost[], null);
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
