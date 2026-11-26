"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icone } from "./Icone";

export type EntradaBusca = { titulo: string; descricao: string; grupo: string; url: string; externo: boolean };

const limpar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Busca({ entradas }: { entradas: EntradaBusca[] }) {
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const caixa = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);

  const indice = useMemo(
    () => entradas.map((e) => ({ e, t: limpar(e.titulo), d: limpar(`${e.descricao} ${e.grupo}`) })),
    [entradas],
  );

  const achados = useMemo(() => {
    const termos = limpar(q).split(/\s+/).filter(Boolean);
    if (!termos.length) return [];
    return indice
      .map((x) => {
        let pontos = 0;
        for (const t of termos) {
          if (x.t.includes(t)) pontos += x.t.startsWith(t) ? 5 : 3;
          else if (x.d.includes(t)) pontos += 1;
          else return { x, pontos: 0 };
        }
        return { x, pontos };
      })
      .filter((r) => r.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 8)
      .map((r) => r.x.e);
  }, [q, indice]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    const fora = (ev: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(ev.target as Node)) setAberto(false);
    };
    const atalho = (ev: KeyboardEvent) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "k") {
        ev.preventDefault();
        campo.current?.focus();
        setAberto(true);
      }
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", atalho);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", atalho);
    };
  }, []);

  function abrir(e: EntradaBusca) {
    setAberto(false);
    setQ("");
    if (e.externo) window.open(e.url, "_blank", "noopener,noreferrer");
    else router.push(e.url);
  }

  function teclas(ev: React.KeyboardEvent) {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      setSel((s) => Math.min(s + 1, achados.length - 1));
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (ev.key === "Enter" && achados[sel]) {
      ev.preventDefault();
      abrir(achados[sel]);
    } else if (ev.key === "Escape") {
      setAberto(false);
      campo.current?.blur();
    }
  }

  const mostrar = aberto && q.trim().length > 0;

  return (
    <div className="busca" ref={caixa} role="search">
      <label className="campo">
        <Icone nome="search" />
        <input
          ref={campo}
          type="search"
          value={q}
          placeholder="Buscar ferramentas, aulas e regras…"
          aria-label="Buscar no painel"
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={teclas}
        />
        <kbd className="hide-m">Ctrl K</kbd>
      </label>
      {mostrar && (
        <ul className="res" role="listbox">
          {achados.length === 0 && <li className="vazio">Nada encontrado para “{q}”.</li>}
          {achados.map((e, i) => (
            <li key={e.url + e.titulo} role="option" aria-selected={i === sel}>
              <button type="button" className={i === sel ? "on" : undefined} onMouseEnter={() => setSel(i)} onClick={() => abrir(e)}>
                <b>{e.titulo}</b>
                <small>{e.grupo}</small>
                {e.descricao && <span>{e.descricao}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
