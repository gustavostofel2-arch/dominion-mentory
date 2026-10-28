import { supabaseAdmin } from "@/lib/supabase/admin";

/** Grava um acesso (login). Nunca derruba a página. */
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
