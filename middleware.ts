import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { assinar, verificar, COOKIE_OK, OPCOES_COOKIE } from "@/lib/sessao";

// Imagens que ficam públicas (usadas na página inicial e no login).
const PUBLICOS = new Set(["/img/logo.png", "/img/higor.webp"]);

function negar(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ehPagina =
    pathname === "/painel" || pathname === "/dominion-flow" || pathname.startsWith("/painel/") || pathname.startsWith("/ferramentas/");
  let resp: NextResponse;
  if (ehPagina) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    resp = NextResponse.redirect(url);
  } else {
    resp = new NextResponse("Acesso restrito. Entre no sistema pelo login.", {
      status: 401,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }
  resp.cookies.delete(COOKIE_OK);
  return resp;
}

function marcar(resp: NextResponse, pathname: string) {
  resp.headers.set("X-Robots-Tag", "noindex");
  // Páginas e ferramentas nunca ficam em cache. Imagens e arquivos definem o próprio cache.
  if (!pathname.startsWith("/img/") && !pathname.startsWith("/workflows/")) {
    resp.headers.set("Cache-Control", "private, no-store");
  }
  return resp;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLICOS.has(pathname)) return NextResponse.next();

  // Caminho rápido: já foi conferido há pouco, não consulta o Supabase.
  if (await verificar(request.cookies.get(COOKIE_OK)?.value)) {
    return marcar(NextResponse.next(), pathname);
  }

  // Caminho lento (1x a cada poucos minutos): confere a sessão e a lista de mentorados.
  const { supabase, response, user } = await updateSession(request);
  if (!user?.email) return negar(request);

  const { data } = await supabase
    .from("mentorados")
    .select("email, nome, ativo")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (!data || !data.ativo) return negar(request);

  const valor = await assinar({ email: data.email, nome: data.nome });
  request.cookies.set(COOKIE_OK, valor); // as rotas e páginas já enxergam o cookie novo
  const final = NextResponse.next({ request });
  response.cookies.getAll().forEach((c) => final.cookies.set(c));
  final.cookies.set(COOKIE_OK, valor, OPCOES_COOKIE);
  return marcar(final, pathname);
}

export const config = {
  matcher: ["/painel/:path*", "/dominion-flow", "/ferramentas/:path*", "/workflows/:path*", "/img/:path*"],
};
