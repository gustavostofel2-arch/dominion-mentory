import { readFile } from "node:fs/promises";
import path from "node:path";
import { after } from "next/server";
import { getMentorado, registrarAcesso } from "@/lib/acesso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Nome do arquivo que a pessoa recebe ao baixar.
const NOMES: Record<string, string> = {
  "pov-perfume-arabe-cenarios-diferentes.json": "dominion-flow-perfume-arabe-cenarios-diferentes.json",
  "pov-perfume-arabe-cenarios-iguais.json": "dominion-flow-perfume-arabe-cenarios-iguais.json",
  "pov-showcase-cabide.json": "dominion-flow-pov-showcase-cabide.json",
  "ugc-try-on.json": "dominion-flow-ugc-try-on.json",
};

// Baixa um workflow (.json) do Dominion Flow. Só mentorados ativos.
export async function GET(_request: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  if (!/^[a-z0-9-]+\.json$/.test(file)) return new Response("Não encontrado", { status: 404 });

  const m = await getMentorado();
  if (!m) return new Response("Acesso restrito.", { status: 401 });

  try {
    const dados = await readFile(path.join(process.cwd(), "private", "workflows", file));
    after(() => registrarAcesso(m.email, "workflow", file));
    const nome = NOMES[file] ?? file;
    return new Response(new Uint8Array(dados), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nome}"`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
