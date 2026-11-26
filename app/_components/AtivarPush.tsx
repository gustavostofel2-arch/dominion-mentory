"use client";

import { useEffect, useState } from "react";
import { cancelarPush, inscreverPush } from "../painel/notificacoes/actions";

type Estado = "carregando" | "indisponivel" | "ios" | "negado" | "inativo" | "ativo";

function chave(base64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const bin = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export default function AtivarPush({ vapid, compacto = false }: { vapid: string | null; compacto?: boolean }) {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!vapid) return vivo && setEstado("indisponivel");
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (ios && !instalado) return vivo && setEstado("ios");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return vivo && setEstado("indisponivel");
      if (Notification.permission === "denied") return vivo && setEstado("negado");
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        if (vivo) setEstado(sub && Notification.permission === "granted" ? "ativo" : "inativo");
      } catch {
        if (vivo) setEstado("inativo");
      }
    })();
    return () => {
      vivo = false;
    };
  }, [vapid]);

  async function ativar() {
    if (!vapid) return;
    setOcupado(true);
    setErro("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setEstado(perm === "denied" ? "negado" : "inativo");
        return;
      }
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave(vapid) }));
      const r = await inscreverPush(JSON.parse(JSON.stringify(sub)), navigator.userAgent);
      if (!r.ok) throw new Error("salvar");
      setEstado("ativo");
    } catch {
      setErro("Não foi possível ativar agora. Tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await cancelarPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inativo");
    } finally {
      setOcupado(false);
    }
  }

  if (estado === "carregando" || estado === "indisponivel") return null;

  return (
    <div className={`push-card${compacto ? " compacto" : ""} ${estado}`}>
      <span className="pc-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
      </span>
      <div className="pc-tx">
        {estado === "ativo" && (
          <>
            <b>Notificações ativadas neste aparelho</b>
            <p>Você será avisado de novidades, avisos e da call, mesmo com o site fechado.</p>
          </>
        )}
        {estado === "inativo" && (
          <>
            <b>Receba os avisos no celular ou computador</b>
            <p>Ative para saber na hora das novidades, avisos importantes e horário das calls.</p>
          </>
        )}
        {estado === "negado" && (
          <>
            <b>Notificações bloqueadas</b>
            <p>Libere nas configurações do navegador (cadeado ao lado do endereço) e recarregue a página.</p>
          </>
        )}
        {estado === "ios" && (
          <>
            <b>No iPhone, instale o app primeiro</b>
            <ol>
              <li>Toque em <b>Compartilhar</b> (quadrado com seta) no Safari.</li>
              <li>Escolha <b>Adicionar à Tela de Início</b>.</li>
              <li>Abra o <b>Dominion</b> pelo ícone e ative as notificações.</li>
            </ol>
          </>
        )}
        {erro && <p className="erro-in">{erro}</p>}
      </div>
      {estado === "inativo" && (
        <button type="button" className="btn primary sm" onClick={ativar} disabled={ocupado}>
          {ocupado ? "Ativando…" : "Ativar"}
        </button>
      )}
      {estado === "ativo" && (
        <button type="button" className="btn sm" onClick={desativar} disabled={ocupado}>
          {ocupado ? "…" : "Desativar"}
        </button>
      )}
    </div>
  );
}
