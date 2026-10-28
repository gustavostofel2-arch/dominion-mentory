"use client";

import { useEffect, useState } from "react";

/** Lê o nome do cookie legível (dm_nome). A página fica estática e o nome entra aqui. */
export function useNome(): string {
  const [nome, setNome] = useState("");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)dm_nome=([^;]*)/);
    if (m) {
      try {
        setNome(decodeURIComponent(m[1]).trim());
      } catch {
        setNome("");
      }
    }
  }, []);
  return nome;
}

export function NomeTopo() {
  const nome = useNome();
  return (
    <span className="who hide-m" title={nome} style={{ visibility: nome ? "visible" : "hidden" }}>
      {nome || "·"}
    </span>
  );
}

export function Saudacao() {
  const nome = useNome();
  const primeiro = nome.split(/\s+/)[0];
  return <h1>{primeiro ? `Olá, ${primeiro}` : "Bem-vindo ao sistema"}</h1>;
}
