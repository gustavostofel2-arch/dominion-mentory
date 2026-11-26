"use client";

import { useEffect, useState } from "react";

function fmt(ms: number) {
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  return `${d} ${d === 1 ? "dia" : "dias"} ${h}h ${m}min`;
}

function texto(n: number, ini: number, fim: number, lim: number | null, completo: boolean) {
  if (n < ini) return `A corrida começa em ${fmt(ini - n)}`;
  if (n <= fim) return `Corrida em andamento · encerra em ${fmt(fim - n)}`;
  if (completo && lim) {
    if (n <= lim) return `Corrida encerrada · envie o faturamento em até ${fmt(lim - n)}`;
    return "Prazo de envio encerrado. Aguarde o resultado na live.";
  }
  return "Corrida encerrada. Aguarde o resultado na live de encerramento.";
}

/** Contagem regressiva da corrida. As datas (ISO) vêm do bloco "Corrida" editado no Admin. */
export default function Countdown({
  inicio,
  fim,
  prazo,
  completo = false,
}: {
  inicio: string;
  fim: string;
  prazo?: string;
  completo?: boolean;
}) {
  const [t, setT] = useState("");
  useEffect(() => {
    const ini = new Date(inicio).getTime();
    const f = new Date(fim).getTime();
    const l = prazo ? new Date(prazo).getTime() : null;
    if (!Number.isFinite(ini) || !Number.isFinite(f)) {
      setT("");
      return;
    }
    const tick = () => setT(texto(Date.now(), ini, f, l && Number.isFinite(l) ? l : null, completo));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [inicio, fim, prazo, completo]);
  if (!t) return null;
  return (
    <div className="count" aria-live="polite">
      {t}
    </div>
  );
}
