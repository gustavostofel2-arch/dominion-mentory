import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { COOKIE_OK, verificar } from "@/lib/sessao";

export type Mentorado = { email: string; nome: string | null };

/**
 * Quem está logado e ativo, ou null. Lê o cookie assinado (sem rede): o middleware
 * é quem confere o Supabase e a lista de mentorados e renova esse cookie.
 */
export async function getMentorado(): Promise<Mentorado | null> {
  const store = await cookies();
  return verificar(store.get(COOKIE_OK)?.value);
}

/** Para páginas: manda para o login se não puder entrar. */
export async function exigirMentorado(caminho: string): Promise<Mentorado> {
  const m = await getMentorado();
  if (!m) redirect(`/login?next=${encodeURIComponent(caminho)}`);
  return m;
}

/** Grava um acesso (login, ferramenta, workflow). Nunca derruba a página. */
export async function registrarAcesso(email: string, evento: string, detalhe?: string) {
  try {
    await supabaseAdmin().from("acessos").insert({ email, evento, detalhe: detalhe ?? null });
  } catch {
    // o registro é opcional
  }
}

/** Aceita só caminhos internos (evita redirecionar para outro site). */
export function caminhoSeguro(valor: unknown, padrao = "/painel"): string {
  const v = typeof valor === "string" ? valor : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : padrao;
}
