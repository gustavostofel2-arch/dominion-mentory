"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { mostrarToast } from "@/lib/toast";

/** Lê "?ok=" / "?erro=" que voltam das ações, mostra como aviso flutuante e limpa o endereço. */
export default function MensagemUrl() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // nas telas do Admin a mensagem já aparece na própria página
    if (pathname.startsWith("/painel/admin")) return;
    const ok = params.get("ok");
    const erro = params.get("erro");
    if (!ok && !erro) return;
    mostrarToast(erro ? { texto: erro, tipo: "erro" } : { texto: ok!, tipo: "ok" });

    // limpa o endereço com uma navegação normal do Next (não com history.replaceState)
    const resto = new URLSearchParams(params.toString());
    resto.delete("ok");
    resto.delete("erro");
    resto.delete("_");
    const q = resto.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
