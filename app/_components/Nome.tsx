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

/** Troca {nome} / [nome] pelo primeiro nome e arruma a pontuação quando o nome não está disponível. */
export function aplicarNome(texto: string, nome: string): string {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  return texto
    .replace(/\{nome\}|\[nome\]/gi, primeiro)
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/,([.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Bloco "Saudação": título, texto pequeno e frase, todos aceitando {nome}. */
export function SaudacaoBloco({ etiqueta, titulo, texto }: { etiqueta: string; titulo: string; texto: string }) {
  const nome = useNome();
  // o nome vem de um cookie lido no navegador: esconde por um instante para não piscar sem o nome
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  const estilo = pronto ? undefined : { visibility: "hidden" as const };
  return (
    <>
      {etiqueta ? <span className="eyebrow" style={estilo}>{aplicarNome(etiqueta, nome)}</span> : null}
      {titulo ? <h1 style={estilo}>{aplicarNome(titulo, nome)}</h1> : null}
      {texto ? <p style={estilo}>{aplicarNome(texto, nome)}</p> : null}
    </>
  );
}
