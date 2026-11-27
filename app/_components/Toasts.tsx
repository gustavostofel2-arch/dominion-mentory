"use client";

import { useEffect, useState } from "react";
import type { ToastDados } from "@/lib/toast";
import { Icone } from "./Icone";

type Item = ToastDados & { id: number };

/** Único lugar onde os avisos flutuantes aparecem: empilhados, sem um cobrir o outro. */
export default function Toasts() {
  const [itens, setItens] = useState<Item[]>([]);

  useEffect(() => {
    const ouvir = (ev: Event) => {
      const d = (ev as CustomEvent<ToastDados>).detail;
      if (!d?.texto) return;
      const id = Date.now() + Math.random();
      setItens((x) => [...x.slice(-2), { ...d, id }]);
      setTimeout(() => setItens((x) => x.filter((t) => t.id !== id)), d.tipo === "erro" ? 9000 : 6500);
    };
    window.addEventListener("dm:toast", ouvir);
    return () => window.removeEventListener("dm:toast", ouvir);
  }, []);

  if (!itens.length) return null;
  const fechar = (id: number) => setItens((x) => x.filter((t) => t.id !== id));

  return (
    <div className="toasts" role="status" aria-live="polite">
      {itens.map((t) => {
        const miolo = (
          <>
            {t.icone && <span className="toast-ic"><Icone nome={t.icone} /></span>}
            <span className="toast-tx">
              <b>{t.texto}</b>
              {t.sub && <small>{t.sub}</small>}
            </span>
          </>
        );
        const classe = `toast${t.tipo === "ok" ? " ok" : t.tipo === "erro" ? " erro" : ""}`;
        return t.link ? (
          <a key={t.id} className={classe} href={t.link} onClick={() => fechar(t.id)}>{miolo}</a>
        ) : (
          <button key={t.id} type="button" className={classe} onClick={() => fechar(t.id)}>{miolo}</button>
        );
      })}
    </div>
  );
}
