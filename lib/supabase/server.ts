import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente do Supabase com a sessão da pessoa (cookies). Usa a chave pública. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(list: { name: string; value: string; options: CookieOptions }[]) {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, { ...options, httpOnly: true }));
          } catch {
            // chamado de um Server Component: o middleware já renova a sessão
          }
        },
      },
    },
  );
}
