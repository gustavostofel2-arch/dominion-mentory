"use client";

import { useEffect, useRef, useState } from "react";
import { abrirSino } from "../painel/notificacoes/actions";
import type { Notif } from "@/lib/notificar";
import NotifItem from "./NotifItem";
import AtivarPush from "./AtivarPush";
import { Icone } from "./Icone";
import { definirSom, liberarAudio, somLigado, tocarSom } from "@/lib/som";

export default function Sino({ naoLidas, vapid }: { naoLidas: number; vapid: string | null }) {
  const [aberto, setAberto] = useState(false);
  const [n, setN] = useState(naoLidas);
  const [itens, setItens] = useState<Notif[] | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const [som, setSom] = useState(true);
  useEffect(() => setSom(somLigado()), []);

  useEffect(() => setN(naoLidas), [naoLidas]);

  // tempo real: chegou algo novo enquanto a pessoa está com o site aberto
  useEffect(() => {
    const novo = () => setN((x) => Math.min(x + 1, 99));
    window.addEventListener("dm:nova-notificacao", novo);
    return () => window.removeEventListener("dm:nova-notificacao", novo);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  async function alternar() {
    const abrir = !aberto;
    setAberto(abrir);
    if (!abrir) return;
    setItens(null);
    try {
      const r = await abrirSino();
      setItens(r.itens);
      setN(0);
    } catch {
      setItens([]);
    }
  }

  return (
    <div className="sino" ref={caixa}>
      <button type="button" className="sino-btn" onClick={alternar} aria-label={n ? `Notificações, ${n} novas` : "Notificações"} aria-expanded={aberto}>
        <Icone nome="bell" />
        {n > 0 && <span className="sino-n">{n > 9 ? "9+" : n}</span>}
      </button>

      {aberto && (
        <div className="sino-pop" role="dialog" aria-label="Notificações">
          <div className="sp-head">
            <b>Notificações</b>
            <a href="/painel/notificacoes">Ver todas →</a>
          </div>
          <AtivarPush vapid={vapid} compacto />
          <div className="sp-opcoes">
            <label className="chk">
              <input
                type="checkbox"
                checked={som}
                onChange={(e) => {
                  setSom(e.target.checked);
                  definirSom(e.target.checked);
                }}
              />
              Som da Dominion
            </label>
            <button type="button" className="btn mini" onClick={() => { liberarAudio(); tocarSom(true); }}>▶ Ouvir</button>
            <button type="button" className="btn mini" onClick={() => { setAberto(false); window.dispatchEvent(new CustomEvent("dm:abrir-guia")); }}>Como ativar no celular</button>
          </div>
          <div className="sp-lista">
            {itens === null && <p className="sp-vazio">Carregando…</p>}
            {itens?.length === 0 && (
              <div className="sp-vazio">
                <Icone nome="bell" />
                <b>Tudo em dia</b>
                <span>Quando a equipe publicar um aviso ou novidade, ele aparece aqui.</span>
              </div>
            )}
            {itens?.map((x) => <NotifItem key={x.id} n={x} />)}
          </div>
        </div>
      )}
    </div>
  );
}
