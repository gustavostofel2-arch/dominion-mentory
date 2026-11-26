"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icone } from "./Icone";

export type ItemNav = { href: string; label: string; curto: string; icone: string; ativoEm?: "exato" | "prefixo"; soDesktop?: boolean };

const MAX_CELULAR = 5;

/** Menu lateral (computador) e barra inferior (celular). Com mais de 5 abas, o celular ganha um botão "Mais". */
export default function NavLateral({ itens }: { itens: ItemNav[] }) {
  const path = usePathname();
  const [aberto, setAberto] = useState(false);

  useEffect(() => setAberto(false), [path]);

  const ativa = (it: ItemNav) => (it.ativoEm === "exato" ? path === it.href : it.ativoEm === "prefixo" ? path.startsWith(it.href) : false);

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
            className={[ativa(it) ? "on" : "", it.soDesktop ? "so-desk" : "", ehExtra(it) ? "mob-extra" : ""].filter(Boolean).join(" ") || undefined}
            aria-current={ativa(it) ? "page" : undefined}
          >
            <Icone nome={it.icone} />
            <span className="lb">{it.label}</span>
            <span className="sh">{it.curto}</span>
          </Link>
        ))}
        {comMais && (
          <button type="button" className={`mais-btn${extraAtivo ? " on" : ""}`} aria-expanded={aberto} onClick={() => setAberto((v) => !v)}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
            <span className="sh">Mais</span>
          </button>
        )}
      </nav>

      {comMais && aberto && (
        <div className="mais-fundo" role="presentation" onClick={() => setAberto(false)}>
          <div className="mais-folha" role="dialog" aria-label="Mais páginas" onClick={(e) => e.stopPropagation()}>
            {extras.map((it) => (
              <Link key={it.href} href={it.href} className={ativa(it) ? "on" : undefined}>
                <Icone nome={it.icone} />
                <span>{it.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
