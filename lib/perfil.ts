import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Busca o @ da pessoa. Devolve "-" se a tabela ainda não existe (não bloqueia o acesso). */
export async function buscarUsuario(email: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin().from("perfis").select("usuario").eq("email", email).maybeSingle();
    if (error) return "-";
    return (data as { usuario?: string } | null)?.usuario ?? null;
  } catch {
    return "-";
  }
}

export const USUARIO_REGEX = /^[a-z0-9._]{3,20}$/;
export const RESERVADOS = new Set(["admin", "administrador", "dominion", "dominionmentory", "suporte", "equipe", "moderador", "higor", "root", "sistema"]);

export function validarUsuario(bruto: string): { ok: true; usuario: string } | { ok: false; erro: string } {
  const u = bruto.trim().toLowerCase().replace(/^@/, "");
  if (u.length < 3) return { ok: false, erro: "Use pelo menos 3 caracteres." };
  if (u.length > 20) return { ok: false, erro: "Use no máximo 20 caracteres." };
  if (!USUARIO_REGEX.test(u)) return { ok: false, erro: "Use só letras minúsculas, números, ponto e sublinhado." };
  if (/^[._]|[._]$/.test(u) || /[._]{2}/.test(u)) return { ok: false, erro: "Não comece nem termine com ponto, e não repita pontos." };
  if (RESERVADOS.has(u)) return { ok: false, erro: "Esse @ é reservado. Escolha outro." };
  return { ok: true, usuario: u };
}
