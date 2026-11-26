"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Mostra "Postagem salva…" / erros que voltam na URL (?ok= / ?erro=) como um aviso flutuante e limpa o endereço. */
export default function MensagemUrl() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    // nas telas do Admin a mensagem já aparece na própria página
    if (pathname.startsWith("/painel/admin")) return;
    const ok = params.get("ok");
    const erro = params.get("erro");
    if (!ok && !erro) return;
    setMsg(erro ? { tipo: "erro", texto: erro } : { tipo: "ok", texto: ok! });

    // limpa o endereço com uma navegação normal do Next (não com history.replaceState,
    // que deixaria a página sem conteúdo quando ela depende da URL, como o modo edição)
    const resto = new URLSearchParams(params.toString());
    resto.delete("ok");
    resto.delete("erro");
    const q = resto.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });

    const t = setTimeout(() => setMsg(null), 6000);
    return () => clearTimeout(t);
  }, [params, pathname, router]);

  if (!msg) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      <button type="button" className={`toast ${msg.tipo}`} onClick={() => setMsg(null)}>
        <span className="toast-tx"><b>{msg.texto}</b></span>
      </button>
    </div>
  );
}
