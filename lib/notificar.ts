import "server-only";
import webpush from "web-push";
import { revalidateTag, unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type TipoNotif = "post" | "aviso" | "manual";

export type Notif = {
  id: string;
  tipo: TipoNotif;
  titulo: string;
  texto: string;
  link: string | null;
  imagemUrl: string | null;
  criadoEm: string;
  nova?: boolean;
};

export function pushConfigurado(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

type Linha = {
  id: string;
  tipo: TipoNotif;
  titulo: string;
  texto: string;
  link: string | null;
  imagem_url: string | null;
  criado_em: string;
};

function paraNotif(l: Linha): Notif {
  return { id: l.id, tipo: l.tipo, titulo: l.titulo, texto: l.texto, link: l.link, imagemUrl: l.imagem_url, criadoEm: l.criado_em };
}

export async function listarNotificacoes(limite = 30): Promise<Notif[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("notificacoes")
      .select("id,tipo,titulo,texto,link,imagem_url,criado_em")
      .order("criado_em", { ascending: false })
      .limit(limite);
    if (error) throw error;
    return ((data ?? []) as Linha[]).map(paraNotif);
  } catch {
    return [];
  }
}

/** Quantas notificações a pessoa ainda não viu (número vermelho do sino). Cache curto: não pesa a cada clique. */
export async function contarNaoLidas(email: string | null): Promise<number> {
  if (!email) return 0;
  return contarEmCache(email);
}

const contarEmCache = unstable_cache(
  async (email: string) => contarNaoLidasAgora(email),
  ["nao-lidas-v1"],
  { tags: ["notificacoes"], revalidate: 20 },
);

async function contarNaoLidasAgora(email: string): Promise<number> {
  try {
    const db = supabaseAdmin();
    const { data } = await db.from("notif_estado").select("lido_ate").eq("email", email).maybeSingle();
    const desde = (data as { lido_ate?: string } | null)?.lido_ate ?? new Date(Date.now() - 3 * 864e5).toISOString();
    const { count } = await db.from("notificacoes").select("id", { count: "exact", head: true }).gt("criado_em", desde);
    return Math.min(count ?? 0, 99);
  } catch {
    return 0;
  }
}

export async function lerLidoAte(email: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin().from("notif_estado").select("lido_ate").eq("email", email).maybeSingle();
    return (data as { lido_ate?: string } | null)?.lido_ate ?? new Date(Date.now() - 3 * 864e5).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/** revalidar: só pode ser true dentro de uma ação (não durante a renderização da página). */
export async function marcarLidas(email: string, revalidar = false) {
  try {
    await supabaseAdmin().from("notif_estado").upsert({ email, lido_ate: new Date().toISOString() });
    if (revalidar) revalidateTag("notificacoes");
  } catch {
    // não derruba a tela
  }
}

export type Resultado = { ok: boolean; push: number; falhas: number; semPush?: boolean; erro?: string };

/** Cria a notificação para toda a comunidade (sino) e dispara o push para quem ativou. */
export async function notificarTodos(n: {
  tipo: TipoNotif;
  titulo: string;
  texto: string;
  link?: string | null;
  imagemUrl?: string | null;
  refId?: string | null;
  autorEmail?: string | null;
}): Promise<Resultado> {
  const db = supabaseAdmin();
  const texto = n.texto.slice(0, 180);
  const { data, error } = await db
    .from("notificacoes")
    .insert({
      tipo: n.tipo,
      titulo: n.titulo.slice(0, 120),
      texto,
      link: n.link ?? null,
      imagem_url: n.imagemUrl ?? null,
      ref_id: n.refId ?? null,
      autor_email: n.autorEmail ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, push: 0, falhas: 0, erro: error?.message ?? "falha ao criar" };
  const id = (data as { id: string }).id;

  if (!pushConfigurado()) return { ok: true, push: 0, falhas: 0, semPush: true };

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "https://dominion-mentory-three.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  // só quem ainda é mentorado ativo recebe
  const [subs, ativos] = await Promise.all([
    db.from("push_inscricoes").select("endpoint,email,p256dh,auth").limit(5000),
    db.from("mentorados").select("email").eq("ativo", true).limit(20000),
  ]);
  const ativosSet = new Set(((ativos.data ?? []) as { email: string }[]).map((x) => x.email));
  const lista = ((subs.data ?? []) as { endpoint: string; email: string; p256dh: string; auth: string }[]).filter((s) =>
    ativosSet.has(s.email),
  );

  const carga = JSON.stringify({
    titulo: n.titulo.slice(0, 120),
    texto,
    link: n.link ?? "/painel",
    imagem: n.imagemUrl ?? undefined,
    tag: `dominion-${id}`,
  });

  let ok = 0;
  let falhas = 0;
  const mortos: string[] = [];
  for (let i = 0; i < lista.length; i += 25) {
    const lote = lista.slice(i, i + 25);
    const rs = await Promise.allSettled(
      lote.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 86400, urgency: "high" }),
      ),
    );
    rs.forEach((r, k) => {
      if (r.status === "fulfilled") ok++;
      else {
        falhas++;
        const code = (r.reason as { statusCode?: number } | null)?.statusCode;
        if (code === 404 || code === 410) mortos.push(lote[k].endpoint);
      }
    });
  }
  if (mortos.length) await db.from("push_inscricoes").delete().in("endpoint", mortos);
  await db.from("notificacoes").update({ push_ok: ok, push_falha: falhas }).eq("id", id);
  return { ok: true, push: ok, falhas };
}
