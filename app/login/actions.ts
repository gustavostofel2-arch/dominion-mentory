"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { caminhoSeguro, registrarAcesso } from "@/lib/acesso";

export type Estado = {
  etapa: "email" | "codigo";
  email?: string;
  erro?: string;
  info?: string;
};

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Etapa 1: confere se o e-mail está liberado e envia o código por e-mail. */
export async function pedirCodigo(_antes: Estado, form: FormData): Promise<Estado> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_OK.test(email)) return { etapa: "email", erro: "Digite um e-mail válido." };

  let ativo: boolean | null = null;
  try {
    const { data, error } = await supabaseAdmin()
      .from("mentorados")
      .select("ativo")
      .eq("email", email)
      .maybeSingle();
    if (error) throw error;
    ativo = data ? data.ativo : null;
  } catch {
    return { etapa: "email", erro: "Não foi possível verificar o acesso agora. Tente de novo em instantes." };
  }

  if (ativo === null) {
    return {
      etapa: "email",
      email,
      erro: "Não encontramos esse e-mail entre os mentorados. Use o e-mail que você usou na compra.",
    };
  }
  if (!ativo) {
    return {
      etapa: "email",
      email,
      erro: "O seu acesso está inativo. Fale com a equipe no grupo da mentoria.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    return {
      etapa: "email",
      email,
      erro: "Não foi possível enviar o código agora. Espere um minuto e tente de novo.",
    };
  }
  return { etapa: "codigo", email, info: `Enviamos um código para ${email}. Veja também o spam.` };
}

/** Etapa 2: confere o código e entra. */
export async function validarCodigo(_antes: Estado, form: FormData): Promise<Estado> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const codigo = String(form.get("codigo") ?? "").replace(/\D/g, "");
  const destino = caminhoSeguro(form.get("next"));
  if (!EMAIL_OK.test(email) || codigo.length < 6) {
    return { etapa: "codigo", email, erro: "Digite o código de 6 dígitos que chegou no seu e-mail." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
  if (error) return { etapa: "codigo", email, erro: "Código inválido ou vencido. Peça um novo." };

  // Confere de novo a lista (e marca o acesso).
  const admin = supabaseAdmin();
  const { data } = await admin.from("mentorados").select("ativo").eq("email", email).maybeSingle();
  if (!data || !data.ativo) {
    await supabase.auth.signOut();
    return { etapa: "email", erro: "O seu acesso não está liberado. Fale com a equipe no grupo da mentoria." };
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
