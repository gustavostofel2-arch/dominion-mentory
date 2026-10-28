import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Mentorado = { email: string; nome: string | null };

/** Retorna o mentorado logado E ativo, ou null. Checa a lista a cada chamada. */
export async function getMentorado(): Promise<Mentorado | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data } = await supabase
    .from("mentorados")
    .select("email, nome, ativo")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (!data || !data.ativo) return null;
  return { email: data.email, nome: data.nome };
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
