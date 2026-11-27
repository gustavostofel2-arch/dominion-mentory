import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notificarTodos } from "@/lib/notificar";
import { textoPuro } from "@/lib/doc";
import { emitir } from "@/lib/tempo-real";

export type StatusAgenda = "pendente" | "enviando" | "enviada" | "falhou" | "cancelada";
export type ItemAgenda = {
  id: string;
  tipo: "notificacao" | "postagem";
  titulo: string;
  texto: string;
  link: string | null;
  post_id: string | null;
  opcoes: { notificar?: boolean; virar_aviso?: boolean; aviso_tipo?: string; aviso_dias?: string };
  enviar_em: string;
  status: StatusAgenda;
  resultado: string | null;
  erro: string | null;
  tentativas: number;
  criado_em: string;
  concluido_em: string | null;
};

const TIPOS_AVISO = ["info", "importante", "urgente"];
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Texto "2026-11-28T19:30" (horário de Brasília, como vem do campo de data) → ISO. Erro se estiver errado ou no passado. */
export function lerQuando(valor: string, margemMs = 60_000): { iso: string } | { erro: string } {
  const v = valor.trim();
  if (!FORMATO_DATA.test(v)) return { erro: "Confira a data e a hora do agendamento." };
  const d = new Date(v + ":00-03:00");
  if (Number.isNaN(d.getTime())) return { erro: "Confira a data e a hora do agendamento." };
  if (d.getTime() < Date.now() + margemMs) return { erro: "Escolha um horário futuro (pelo menos 1 minuto à frente)." };
  return { iso: d.toISOString() };
}

/** ISO → valor do campo de data (horário de Brasília). */
export function paraCampoData(iso: string): string {
  const d = new Date(new Date(iso).getTime() - 3 * 3600_000);
  return d.toISOString().slice(0, 16);
}

type PostMin = { id: string; titulo: string; corpo: string; publicado: boolean; imagem: string | null; formato: string | null };

/** Cria, atualiza ou remove o aviso ligado a uma postagem (o aviso leva para a postagem). */
export async function sincronizarAvisoDoPost(
  opts: { quer: boolean; tipo: string; dias: string },
  post: PostMin,
): Promise<"criado" | "atualizado" | "removido" | "nenhum"> {
  const db = supabaseAdmin();
  const quer = opts.quer && post.publicado;
  const { data: atual } = await db.from("avisos").select("id").eq("post_id", post.id).maybeSingle();
  if (!quer) {
    if (atual) {
      await db.from("avisos").delete().eq("post_id", post.id);
      return "removido";
    }
    return "nenhum";
  }
  const campos: Record<string, unknown> = {
    titulo: post.titulo.slice(0, 140),
    texto: "", // aviso de postagem leva só a imagem e o título; o texto fica na própria postagem
    tipo: TIPOS_AVISO.includes(opts.tipo) ? opts.tipo : "importante",
    link_url: `/painel/novidades/${post.id}`,
    link_texto: "Ver postagem",
    ativo: true,
    imagem_url: post.imagem,
  };
  if (opts.dias !== "manter" || !atual) {
    const n = Number(opts.dias);
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

function limparCaches() {
  for (const t of ["catalogo", "avisos", "posts", "notificacoes"]) revalidateTag(t);
  revalidatePath("/painel");
  revalidatePath("/painel/novidades");
  revalidatePath("/painel/admin/agenda");
}

type Saida = { ok: boolean; resultado: string; erro?: string };

/** Executa UM item da agenda (já reservado como "enviando"). */
async function executar(item: ItemAgenda): Promise<Saida> {
  const db = supabaseAdmin();
  if (item.tipo === "notificacao") {
    const r = await notificarTodos({ tipo: "manual", titulo: item.titulo, texto: item.texto, link: item.link ?? "/painel", autorEmail: null });
    if (!r.ok) return { ok: false, resultado: "", erro: r.erro ?? "Não consegui criar a notificação." };
    await emitir({ t: "notificacao" });
    if (r.semPush) return { ok: true, resultado: "Enviada no sino (push não configurado)." };
    if (r.erroPush) return { ok: true, resultado: "Enviada no sino.", erro: `Push falhou: ${r.erroPush}` };
    return { ok: true, resultado: `Enviada no sino e por push para ${r.push} aparelho(s)${r.falhas ? `, ${r.falhas} falharam` : ""}.` };
  }

  // postagem: publica agora
  if (!item.post_id) return { ok: false, resultado: "", erro: "A postagem agendada foi apagada." };
  const { data, error } = await db.from("posts").select("id,titulo,corpo,imagem_url,formato").eq("id", item.post_id).maybeSingle();
  if (error || !data) return { ok: false, resultado: "", erro: error?.message ?? "A postagem agendada foi apagada." };
  const p = data as { id: string; titulo: string; corpo: string; imagem_url: string | null; formato: string | null };
  const up = await db.from("posts").update({ publicado: true, criado_em: new Date().toISOString() }).eq("id", p.id);
  if (up.error) return { ok: false, resultado: "", erro: up.error.message };

  const partes = ["Publicada."];
  let erro: string | undefined;
  const o = item.opcoes ?? {};
  try {
    const av = await sincronizarAvisoDoPost(
      { quer: !!o.virar_aviso, tipo: o.aviso_tipo ?? "importante", dias: o.aviso_dias ?? "1" },
      { id: p.id, titulo: p.titulo, corpo: p.corpo, publicado: true, imagem: p.imagem_url, formato: p.formato },
    );
    if (av === "criado") partes.push("Aviso criado no Início.");
  } catch (e) {
    erro = "Aviso não criado: " + ((e as { message?: string })?.message ?? "erro");
  }
  if (o.notificar) {
    const r = await notificarTodos({
      tipo: "post",
      titulo: p.titulo,
      texto: textoPuro(p.corpo).slice(0, 140),
      link: `/painel/novidades/${p.id}`,
      imagemUrl: p.imagem_url,
      refId: p.id,
      autorEmail: null,
    });
    if (!r.ok) erro = (erro ? erro + " " : "") + "Notificação falhou: " + (r.erro ?? "erro");
    else if (r.erroPush) erro = (erro ? erro + " " : "") + "Push falhou: " + r.erroPush;
    else partes.push(r.semPush ? "Notificada no sino." : `Notificada (push para ${r.push} aparelho(s)).`);
  }
  await emitir({ t: "post" });
  return { ok: true, resultado: partes.join(" "), erro };
}

/** Envia tudo que já passou da hora. Chamada pelo cron (a cada minuto) e pelos botões do Admin. */
export async function processarAgenda(somenteId?: string): Promise<{ processados: number; enviadas: number; falhas: number }> {
  const db = supabaseAdmin();
  const base = db.from("agenda").select("id").eq("status", "pendente");
  const { data, error } = somenteId
    ? await base.eq("id", somenteId).limit(1)
    : await base.lte("enviar_em", new Date().toISOString()).order("enviar_em").limit(10);
  if (error) throw new Error(error.message);

  let enviadas = 0;
  let falhas = 0;
  const ids = ((data ?? []) as { id: string }[]).map((x) => x.id);
  for (const id of ids) {
    // reserva a linha: se outra execução pegou antes, não volta nada e a gente pula
    const { data: linha } = await db.from("agenda").update({ status: "enviando" }).eq("id", id).eq("status", "pendente").select("*").maybeSingle();
    if (!linha) continue;
    const item = linha as ItemAgenda;
    let r: Saida;
    try {
      r = await executar(item);
    } catch (e) {
      r = { ok: false, resultado: "", erro: (e as { message?: string })?.message ?? "erro inesperado" };
    }
    await db
      .from("agenda")
      .update({
        status: r.ok ? "enviada" : "falhou",
        resultado: r.resultado || null,
        erro: r.erro ? r.erro.slice(0, 300) : null,
        tentativas: item.tentativas + 1,
        concluido_em: new Date().toISOString(),
      })
      .eq("id", id);
    if (r.ok) enviadas++;
    else falhas++;
  }
  if (ids.length) limparCaches();
  return { processados: ids.length, enviadas, falhas };
}

/** Marca que o verificador rodou (aparece no Admin como "última checagem"). */
export async function registrarPulso(resumo: string) {
  try {
    await supabaseAdmin().from("agenda_pulso").upsert({ id: 1, ultima_execucao: new Date().toISOString(), resumo: resumo.slice(0, 200) });
  } catch {
    // só informativo
  }
}
