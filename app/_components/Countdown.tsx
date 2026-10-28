"use client";

import { useEffect, useState } from "react";

const INI = new Date("2026-11-01T00:00:00-03:00").getTime();
const FIM = new Date("2026-11-30T23:59:59-03:00").getTime();
const LIM = new Date("2026-12-02T23:59:59-03:00").getTime();

function fmt(ms: number) {
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  return `${d} ${d === 1 ? "dia" : "dias"} ${h}h ${m}min`;
}

// completo = versão do painel (com o prazo de envio). Sem isso, é a da página pública.
function texto(n: number, completo: boolean) {
  if (n < INI) return `A corrida começa em ${fmt(INI - n)}`;
  if (n <= FIM) return `Corrida em andamento · encerra em ${fmt(FIM - n)}`;
  if (completo) {
    if (n <= LIM) return `Corrida encerrada · envie o faturamento em até ${fmt(LIM - n)}`;
    return "Prazo de envio encerrado. Aguarde o resultado na live.";
  }
  return "Corrida encerrada. Aguarde o resultado na live de encerramento.";
}

export default function Countdown({ completo = false }: { completo?: boolean }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(texto(Date.now(), completo));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [completo]);
  return (
    <div className="count" aria-live="polite">
      {t}
    </div>
  );
}
