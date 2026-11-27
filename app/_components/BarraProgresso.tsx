"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Barrinha fina no topo que aparece assim que se toca num link do painel e some quando a página chega.
 * Dá resposta imediata ao toque (o servidor leva um instante para entregar a próxima tela).
 */
export default function BarraProgresso() {
  const path = usePathname();
  const busca = useSearchParams();
  const [ativa, setAtiva] = useState(false);
  const limite = useRef<ReturnType<typeof setTimeout>>(undefined);

  // a página chegou
  useEffect(() => {
    setAtiva(false);
    clearTimeout(limite.current);
  }, [path, busca]);

  useEffect(() => {
    function aoClicar(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setAtiva(true);
      clearTimeout(limite.current);
      limite.current = setTimeout(() => setAtiva(false), 10000); // segurança: nunca fica preso
    }
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, []);

  return <div className={`barra-prog${ativa ? " on" : ""}`} aria-hidden />;
}
