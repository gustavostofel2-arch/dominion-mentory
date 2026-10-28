import { readFile } from "node:fs/promises";
import path from "node:path";
import { getMentorado } from "@/lib/acesso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Imagens das aulas e ferramentas. Só mentorados ativos. (logo.png e higor.webp
// são públicos e ficam em /public/img.)
export async function GET(_request: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const tipo = TIPOS[path.extname(file).toLowerCase()];
  if (!tipo || !/^[A-Za-z0-9._-]+$/.test(file)) return new Response("Não encontrado", { status: 404 });

  if (!(await getMentorado())) return new Response("Acesso restrito.", { status: 401 });

  try {
    const dados = await readFile(path.join(process.cwd(), "private", "img", file));
    return new Response(new Uint8Array(dados), {
      headers: { "Content-Type": tipo, "Cache-Control": "private, max-age=3600", "X-Robots-Tag": "noindex" },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
