"use client";

import { useState } from "react";
import { ICONES_PAGINA } from "@/lib/blocos";
import { Icone } from "./Icone";

/** Grade de ícones para escolher o da aba. Envia o nome escolhido no campo `nome`. */
export default function EscolherIcone({ nome = "icone", valor = "grid" }: { nome?: string; valor?: string }) {
  const [v, setV] = useState(valor);
  return (
    <div className="icones-grade" role="radiogroup" aria-label="Ícone">
      <input type="hidden" name={nome} value={v} />
      {ICONES_PAGINA.map((i) => (
        <button type="button" key={i} role="radio" aria-checked={v === i} aria-label={i} className={v === i ? "on" : undefined} onClick={() => setV(i)}>
          <Icone nome={i} />
        </button>
      ))}
    </div>
  );
}
