import { NextResponse, type NextRequest } from "next/server";
import { assinar, COOKIE_OK, OPCOES_COOKIE, verificar } from "@/lib/sessao";
import { buscarUsuario } from "@/lib/perfil";

/**
 * Atualiza o cookie de sessão com o @ que já está salvo no banco (quando a pessoa criou o @ em outro aparelho).
 * Só confia no cookie assinado atual; o @ vem do banco, nunca da URL.
 */
export async function GET(request: NextRequest) {
  const base = request.nextUrl.clone();
  base.search = "";
  const atual = await verificar(request.cookies.get(COOKIE_OK)?.value);
  if (!atual) {
    base.pathname = "/login";
    return NextResponse.redirect(base);
  }
  const usuario = await buscarUsuario(atual.email);
  base.pathname = usuario ? "/painel" : "/bem-vindo";
  const resp = NextResponse.redirect(base);
  if (usuario) resp.cookies.set(COOKIE_OK, await assinar({ email: atual.email, nome: atual.nome, usuario }), OPCOES_COOKIE);
  return resp;
}
