"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessaoLogada } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validarUsuario } from "@/lib/perfil";
import { assinar, COOKIE_OK, OPCOES_COOKIE } from "@/lib/sessao";

export type EstadoPerfil = { erro?: string };

/** Confere na hora se o @ está livre (usado enquanto a pessoa digita). */
export async function usuarioDisponivel(valor: string): Promise<{ ok: boolean; msg: string }> {
  const s = await sessaoLogada();
  if (!s) return { ok: false, msg: "Sessão expirada. Entre de novo." };
  const v = validarUsuario(valor);
  if (!v.ok) return { ok: false, msg: v.erro };
  try {
    const { data, error } = await supabaseAdmin().from("perfis").select("email").eq("usuario", v.usuario).maybeSingle();
    if (error) throw error;
    if (data && (data as { email: string }).email !== s.email) return { ok: false, msg: "Esse @ já está em uso." };
    return { ok: true, msg: "Disponível!" };
  } catch {
    return { ok: false, msg: "Não consegui conferir agora. Tente de novo." };
  }
}

export async function criarPerfil(_antes: EstadoPerfil, form: FormData): Promise<EstadoPerfil> {
  const s = await sessaoLogada();
  if (!s) return { erro: "Sua sessão expirou. Entre de novo." };
  const v = validarUsuario(String(form.get("usuario") ?? ""));
  if (!v.ok) return { erro: v.erro };

  let usuarioFinal = v.usuario;
  const { error } = await supabaseAdmin().from("perfis").insert({ email: s.email, usuario: v.usuario });
  if (error) {
    if (error.code === "23505") {
      // ou o @ já é de outra pessoa, ou esta pessoa já criou o dela em outro aparelho
      const { data } = await supabaseAdmin().from("perfis").select("usuario").eq("email", s.email).maybeSingle();
      if (!data) return { erro: "Esse @ já está em uso. Escolha outro." };
      // o @ que vale é SEMPRE o que está salvo no banco, nunca o que foi digitado agora
      usuarioFinal = (data as { usuario: string }).usuario;
    } else {
      return { erro: "Não foi possível salvar agora. Tente de novo." };
    }
  }

  const jar = await cookies();
  jar.set(COOKIE_OK, await assinar({ email: s.email, nome: s.nome, usuario: usuarioFinal }), OPCOES_COOKIE);
  redirect("/painel");
}
