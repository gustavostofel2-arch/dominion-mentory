import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notificarTodos } from "@/lib/notificar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Chamada todo minuto pela Vercel (cron em vercel.json). Envia as notificações agendadas que já chegaram na hora.
 * Só aceita quem mandar o segredo CRON_SECRET (a Vercel manda sozinha no cabeçalho Authorization).
 */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new NextResponse("Não autorizado", { status: 401 });
  }
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("notificacoes_agendadas")
    .select("id")
    .eq("status", "pendente")
    .lte("enviar_em", new Date().toISOString())
    .order("enviar_em")
    .limit(10);
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });

  let enviadas = 0;
  for (const { id } of (data ?? []) as { id: string }[]) {
    // "reserva" a linha: se outra execução pegou antes, não volta nada e a gente pula
    const { data: linha } = await db
      .from("notificacoes_agendadas")
      .update({ status: "enviando" })
      .eq("id", id)
      .eq("status", "pendente")
      .select("titulo,texto,link,autor_email")
      .maybeSingle();
    if (!linha) continue;
    const n = linha as { titulo: string; texto: string; link: string | null; autor_email: string | null };
    try {
      const r = await notificarTodos({ tipo: "manual", titulo: n.titulo, texto: n.texto, link: n.link ?? "/painel", autorEmail: n.autor_email });
      await db
        .from("notificacoes_agendadas")
        .update({ status: r.ok ? "enviada" : "falhou", enviada_em: new Date().toISOString() })
        .eq("id", id);
      if (r.ok) enviadas++;
    } catch {
      await db.from("notificacoes_agendadas").update({ status: "falhou" }).eq("id", id);
    }
  }
  if (enviadas) revalidateTag("notificacoes");
  return NextResponse.json({ ok: true, enviadas });
}
