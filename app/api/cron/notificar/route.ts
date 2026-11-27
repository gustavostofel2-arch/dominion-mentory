import { NextResponse } from "next/server";
import { processarAgenda, registrarPulso } from "@/lib/agenda";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Chamada todo minuto pela Vercel (cron em vercel.json). Envia o que está na Agenda e já chegou na hora.
 * Não precisa de segredo: ela só executa o que o admin já agendou (nunca recebe conteúdo de fora).
 */
export async function GET() {
  const cab = { "Cache-Control": "no-store" };
  try {
    const r = await processarAgenda();
    await registrarPulso(r.processados ? `${r.enviadas} enviada(s), ${r.falhas} falha(s)` : "nada para enviar");
    return NextResponse.json({ ok: true, ...r }, { headers: cab });
  } catch (e) {
    const m = (e as { message?: string })?.message ?? "erro";
    await registrarPulso("erro: " + m);
    return NextResponse.json({ ok: false, erro: m }, { status: 500, headers: cab });
  }
}
