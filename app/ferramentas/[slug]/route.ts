import { readFile } from "node:fs/promises";
import path from "node:path";
import { getMentorado, registrarAcesso } from "@/lib/acesso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CABECALHOS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return new Response("Não encontrado", { status: 404 });

  const m = await getMentorado();
  if (!m) {
    const next = encodeURIComponent(new URL(request.url).pathname);
    return Response.redirect(new URL(`/login?next=${next}`, request.url), 302);
  }

  let html: string;
  try {
    html = await readFile(path.join(process.cwd(), "private", "ferramentas", `${slug}.html`), "utf8");
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }

  // O botão de voltar das ferramentas agora leva para o painel do sistema.
  const i = html.indexOf('id="dm-bar"');
  if (i >= 0) html = html.slice(0, i) + html.slice(i).replace('<a href="/"', '<a href="/painel"');

  void registrarAcesso(m.email, "ferramenta", slug);
  return new Response(html, { headers: CABECALHOS });
}
