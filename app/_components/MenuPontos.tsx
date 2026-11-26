"use client";

import { useEffect, useRef, useState } from "react";

export type ItemMenu = {
  rotulo: string;
  /** Server action chamada pelo formulário (envia os campos abaixo). */
  acao?: (form: FormData) => void | Promise<void>;
  campos?: Record<string, string>;
  /** Em vez de enviar formulário, executa isto (ex.: abrir o editor). */
  aoClicar?: () => void;
  perigo?: boolean;
  confirmar?: string;
};

/** Os 3 pontinhos (⋯) como no Instagram: abre uma lista de ações. */
export default function MenuPontos({ itens, rotulo = "Mais opções", classe = "" }: { itens: ItemMenu[]; rotulo?: string; classe?: string }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent | TouchEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("touchstart", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("touchstart", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  if (!itens.length) return null;

  return (
    <div className={`pontos ${classe}`} ref={caixa}>
      <button type="button" className="pontos-btn" aria-label={rotulo} aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {aberto && (
        <div className="pontos-menu" role="menu">
          {itens.map((it) =>
            it.acao ? (
              <form action={it.acao} key={it.rotulo} role="none">
                {Object.entries(it.campos ?? {}).map(([k, v]) => (
                  <input type="hidden" name={k} value={v} key={k} />
                ))}
                <button
                  type="submit"
                  role="menuitem"
                  className={it.perigo ? "perigo" : undefined}
                  onClick={(e) => {
                    if (it.confirmar && !window.confirm(it.confirmar)) e.preventDefault();
                    else setTimeout(() => setAberto(false), 0);
                  }}
                >
                  {it.rotulo}
                </button>
              </form>
            ) : (
              <button
                type="button"
                key={it.rotulo}
                role="menuitem"
                className={it.perigo ? "perigo" : undefined}
                onClick={() => {
                  setAberto(false);
                  it.aoClicar?.();
                }}
              >
                {it.rotulo}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
