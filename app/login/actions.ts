"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { caminhoSeguro, registrarAcesso } from "@/lib/acesso";

export type Estado = { erro?: string; email?: string };

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Entra só com o e-mail: se estiver na lista de mentorados ativos, o servidor cria
 * a sessão na hora. Nenhum e-mail é enviado.
 */
export async function entrar(_antes: Estado, form: FormData): Promise<Estado> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const destino = caminhoSeguro(form.get("next"));
  if (!EMAIL_OK.test(email)) return { email, erro: "Digite um e-mail válido." };

  const admin = supabaseAdmin();

  // 1) Está na lista e ativo?
  let ativo: boolean | null = null;
  try {
    const { data, error } = await admin.from("mentorados").select("ativo").eq("email", email).maybeSingle();
    if (error) throw error;
    ativo = data ? data.ativo : null;
  } catch {
    return { email, erro: "Não foi possível verificar o acesso agora. Tente de novo em instantes." };
  }
  if (ativo === null) {
    return { email, erro: "Não encontramos esse e-mail entre os mentorados. Use o e-mail que você usou na compra." };
  }
  if (!ativo) {
    return { email, erro: "O seu acesso está inativo. Fale com a equipe no grupo da mentoria." };
  }

  // 2) Cria a sessão sem enviar e-mail (gera o token no servidor e já usa).
  try {
    let { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data?.properties?.hashed_token) {
      // primeira vez desta pessoa: cria o usuário e tenta de novo
      const criado = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (criado.error && !/already|registered|exists/i.test(criado.error.message)) throw criado.error;
      ({ data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email }));
    }
    const token = data?.properties?.hashed_token;
    if (error || !token) throw error ?? new Error("sem token");

    const supabase = await createClient();
    const { error: erroSessao } = await supabase.auth.verifyOtp({ token_hash: token, type: "magiclink" });
    if (erroSessao) throw erroSessao;
  } catch {
    return { email, erro: "Não foi possível entrar agora. Tente de novo em instantes." };
  }

  await admin.from("mentorados").update({ ultimo_acesso: new Date().toISOString() }).eq("email", email);
  await registrarAcesso(email, "login");

  redirect(destino);
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
