"use client";

import { useState, useTransition } from "react";
import { alternarCurtida } from "../painel/novidades/actions";

export default function CurtirBotao({ postId, curtidas, euCurti }: { postId: string; curtidas: number; euCurti: boolean }) {
  const [estado, setEstado] = useState({ curtidas, euCurti });
  const [, iniciar] = useTransition();

  function clicar() {
    const antes = estado;
    // atualiza na hora; se o servidor responder diferente, ajusta
    setEstado({ curtidas: antes.curtidas + (antes.euCurti ? -1 : 1), euCurti: !antes.euCurti });
    iniciar(async () => {
      try {
        const r = await alternarCurtida(postId);
        if (r) setEstado(r);
        else setEstado(antes);
      } catch {
        setEstado(antes);
      }
    });
  }

  return (
    <button type="button" className={`like${estado.euCurti ? " on" : ""}`} onClick={clicar} aria-pressed={estado.euCurti} aria-label="Curtir">
      <svg viewBox="0 0 24 24" fill={estado.euCurti ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6.6 5.4 5.4 0 0 1 21.3 12C19 16.6 12 21 12 21z" />
      </svg>
      <span>{estado.curtidas}</span>
    </button>
  );
}
