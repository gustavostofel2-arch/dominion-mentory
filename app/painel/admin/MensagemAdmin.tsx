"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CHAVE = "dm_ultima_msg";

/**
 * Faixa de "salvo!" / erro das telas do Admin. A mensagem volta na URL (?ok= / ?erro= e um carimbo _=) e é lida AQUI, no navegador.
 * Não mexemos no endereço depois (isso deixava a tela em branco); o carimbo evita repetir a mensagem ao dar F5.
 */
export default function MensagemAdmin() {
  const params = useSearchParams();
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    const ok = params.get("ok");
    const erro = params.get("erro");
    const carimbo = params.get("_") ?? "";
    if (!ok && !erro) {
      setMsg(null);
      return;
    }
    try {
      if (carimbo && sessionStorage.getItem(CHAVE) === carimbo) return; // já mostrada (F5)
      if (carimbo) sessionStorage.setItem(CHAVE, carimbo);
    } catch {
      // sem sessionStorage: mostra sempre
    }
    setMsg(erro ? { tipo: "erro", texto: erro } : { tipo: "ok", texto: ok! });
    window.scrollTo({ top: 0 });
  }, [params]);

  if (!msg) return null;
  return (
    <div
      className="nota"
      role={msg.tipo === "erro" ? "alert" : "status"}
      style={msg.tipo === "erro" ? { borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" } : undefined}
    >
      {msg.texto}
    </div>
  );
}
