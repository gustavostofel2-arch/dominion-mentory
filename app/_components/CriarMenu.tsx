"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icone } from "./Icone";

const ITENS = [
  { href: "/painel/admin/posts", titulo: "Nova postagem", sub: "Novidade ou aula, em Novidades", icone: "news" },
  { href: "/painel/admin/avisos", titulo: "Novo aviso", sub: "Urgente, no carrossel do Início", icone: "megaphone" },
  { href: "/painel/admin/notificacoes", titulo: "Nova notificação", sub: "Sino e push para todos", icone: "bell" },
  { href: "/painel/admin/paginas#nova", titulo: "Nova página (aba do menu)", sub: "Crie uma aba e monte com blocos", icone: "layers" },
  { href: "/painel/admin", titulo: "Painel Admin", sub: "Ferramentas, módulos e mais", icone: "shield" },
];

/** Só para admins: um botão "+ Criar" sempre à mão, em qualquer tela. */
export default function CriarMenu() {
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

  return (
    <div className="criar" ref={caixa}>
      <button type="button" className="criar-btn" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
        <span aria-hidden="true">＋</span>
        <b>Criar</b>
      </button>
      {aberto && (
        <div className="criar-pop" role="menu">
          {ITENS.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem" onClick={() => setAberto(false)}>
              <span className="ic"><Icone nome={i.icone} /></span>
              <span><b>{i.titulo}</b><small>{i.sub}</small></span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
