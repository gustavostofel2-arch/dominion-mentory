import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  assinar,
  verificar,
  COOKIE_NOME,
  COOKIE_OK,
  OPCOES_COOKIE,
  OPCOES_COOKIE_NOME,
  type SessaoOk,
} from "@/lib/sessao";

// Este arquivo é o "porteiro". Ele roda na borda da Vercel ANTES de qualquer página
// ou arquivo restrito ser entregue (inclusive os estáticos de /public).

// Imagens que ficam públicas (usadas na página inicial e no login).
const PUBLICOS = new Set(["/img/logo.png", "/img/higor.webp"]);

function negar(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ehPagina = pathname === "/painel" || pathname.startsWith("/painel/") || pathname.startsWith("/ferramentas/");
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

/** Cabeçalhos das respostas liberadas. */
function marcar(resp: NextResponse, pathname: string) {
  resp.headers.set("X-Robots-Tag", "noindex");
  if (pathname.startsWith("/img/")) resp.headers.set("Cache-Control", "private, max-age=86400");
  else if (pathname.startsWith("/ferramentas/")) resp.headers.set("Cache-Control", "private, max-age=600");
  else resp.headers.set("Cache-Control", "private, no-store");
  return resp;
}

/** Anota "fulano abriu a ferramenta X" sem atrasar a resposta. */
function registrar(event: NextFetchEvent, email: string, pathname: string) {
  if (!pathname.startsWith("/ferramentas/")) return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  const slug = pathname.replace("/ferramentas/", "").replace(/\.html$/, "");
  event.waitUntil(
    fetch(`${url}/rest/v1/acessos`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ email, evento: "ferramenta", detalhe: slug }),
    }).catch(() => undefined),
  );
}

function liberar(request: NextRequest, event: NextFetchEvent, ok: SessaoOk, resp: NextResponse) {
  const { pathname } = request.nextUrl;
  registrar(event, ok.email, pathname);
  return marcar(resp, pathname);
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  if (PUBLICOS.has(pathname)) return NextResponse.next();

  const atual = await verificar(request.cookies.get(COOKIE_OK)?.value);

  // Quem já está dentro não precisa ver o login.
  if (pathname === "/login") {
    if (atual) {
      const url = request.nextUrl.clone();
      const next = request.nextUrl.searchParams.get("next") ?? "";
      url.pathname = next.startsWith("/") && !next.startsWith("//") ? next.split("?")[0] : "/painel";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Caminho rápido: já foi conferido há pouco, não consulta o Supabase.
  if (atual) {
    const resp = NextResponse.next();
    if (atual.nome && !request.cookies.get(COOKIE_NOME)) {
      resp.cookies.set(COOKIE_NOME, atual.nome, OPCOES_COOKIE_NOME);
    }
    return liberar(request, event, atual, resp);
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
  request.cookies.set(COOKIE_OK, valor);
  const final = NextResponse.next({ request });
  response.cookies.getAll().forEach((c) => final.cookies.set(c));
  final.cookies.set(COOKIE_OK, valor, OPCOES_COOKIE);
  if (data.nome) final.cookies.set(COOKIE_NOME, data.nome, OPCOES_COOKIE_NOME);
  return liberar(request, event, { email: data.email, nome: data.nome }, final);
}

export const config = {
  matcher: ["/painel/:path*", "/ferramentas/:path*", "/img/:path*", "/login"],
};
