"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icone } from "./Icone";

export type ItemNav = { href: string; label: string; curto: string; icone: string; ativoEm?: "exato" | "prefixo"; soDesktop?: boolean };

const MAX_CELULAR = 5;

/** Menu lateral (computador) e barra inferior (celular). Com mais de 5 abas, o celular ganha um botão "Mais". */
export default function NavLateral({ itens }: { itens: ItemNav[] }) {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);
  // aba tocada: acende na hora, sem esperar a página chegar
  const [indo, setIndo] = useState<string | null>(null);

  useEffect(() => {
    setAberto(false);
    setIndo(null);
  }, [path]);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  // "/painel/regras" não pode deixar "/painel/regras-2" ativa ao mesmo tempo: compara o trecho inteiro
  const ativa = (it: ItemNav) =>
    indo !== null ? it.href === indo : it.ativoEm === "exato" ? path === it.href : it.ativoEm === "prefixo" ? path === it.href || path.startsWith(it.href + "/") : false;

  const paraCelular = itens.filter((i) => !i.soDesktop);
  const comMais = paraCelular.length > MAX_CELULAR;
  const extras = comMais ? paraCelular.slice(MAX_CELULAR - 1) : [];
  const ehExtra = (it: ItemNav) => extras.includes(it);
  const extraAtivo = extras.some(ativa);

  return (
    <>
      <nav aria-label="Menu principal">
        {itens.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            prefetch
            onClick={() => setIndo(it.href)}
            className={[ativa(it) ? "on" : "", it.soDesktop ? "so-desk" : "", ehExtra(it) ? "mob-extra" : ""].filter(Boolean).join(" ") || undefined}
            aria-current={ativa(it) ? "page" : undefined}
          >
            <Icone nome={it.icone} />
            <span className="lb">{it.label}</span>
            <span className="sh">{it.curto}</span>
          </Link>
        ))}
        {comMais && (
          <button type="button" className={`mais-btn${extraAtivo ? " on" : ""}`} aria-expanded={aberto} aria-haspopup="dialog" onClick={() => setAberto((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
            <span className="sh">Mais</span>
          </button>
        )}
      </nav>

      {/* em portal: dentro do menu fixo (com blur) o "fixed" ficava preso à barra e não cobria a tela */}
      {comMais &&
        aberto &&
        createPortal(
          <div className="mais-fundo" role="presentation" onClick={() => setAberto(false)}>
            <div className="mais-folha" role="dialog" aria-label="Mais páginas" onClick={(e) => e.stopPropagation()}>
              {extras.map((it) => (
                <Link key={it.href} href={it.href} className={ativa(it) ? "on" : undefined} onClick={() => setIndo(it.href)}>
                  <Icone nome={it.icone} />
                  <span>{it.label}</span>
                </Link>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
