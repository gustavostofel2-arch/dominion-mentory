import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { COOKIE_OK, verificar } from "@/lib/sessao";

/** E-mail da pessoa logada, lido do cookie assinado (vale por alguns minutos). */
export async function emailLogado(): Promise<string | null> {
  const jar = await cookies();
  const s = await verificar(jar.get(COOKIE_OK)?.value);
  return s?.email ?? null;
}

/** Confere no banco, sem cache: o e-mail está em "admins" e é mentorado ativo? */
async function conferirAdmin(email: string): Promise<boolean> {
  try {
    const db = supabaseAdmin();
    const [a, m] = await Promise.all([
      db.from("admins").select("email").eq("email", email).maybeSingle(),
      db.from("mentorados").select("ativo").eq("email", email).maybeSingle(),
    ]);
    if (a.error || m.error) return false;
    return !!a.data && !!m.data?.ativo;
  } catch {
    return false;
  }
}

/** Só para mostrar ou esconder o menu Admin (cache curto). A segurança de verdade é exigirAdmin(). */
const adminEmCache = unstable_cache(async (email: string) => conferirAdmin(email), ["eh-admin-v1"], {
  revalidate: 60,
  tags: ["admins"],
});

export async function ehAdminParaMenu(email: string | null): Promise<boolean> {
  return email ? adminEmCache(email) : false;
}

/** Use no começo de TODA ação e página do Admin. Sem ser admin, responde 404. */
export async function exigirAdmin(): Promise<string> {
  const email = await emailLogado();
  if (!email || !(await conferirAdmin(email))) notFound();
  return email;
}
