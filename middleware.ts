import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Imagens que ficam públicas (usadas na página inicial e no login).
const PUBLICOS = new Set(["/img/logo.png", "/img/higor.webp"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLICOS.has(pathname)) return NextResponse.next();

  const { response, user } = await updateSession(request);

  // Sem sessão: páginas vão para o login; arquivos recebem 401.
  if (!user) {
    const ehPagina = pathname === "/painel" || pathname === "/dominion-flow" || pathname.startsWith("/painel/");
    if (ehPagina) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/ferramentas/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return new NextResponse("Acesso restrito. Entre no sistema pelo login.", {
      status: 401,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  }

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/painel/:path*", "/dominion-flow", "/ferramentas/:path*", "/workflows/:path*", "/img/:path*"],
};
