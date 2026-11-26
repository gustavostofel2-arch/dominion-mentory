"use client";

import { usePathname } from "next/navigation";
import { Icone } from "./Icone";

export type ItemNav = { href: string; label: string; curto: string; icone: string; ativoEm?: "exato" | "prefixo" };

export default function NavLateral({ itens }: { itens: ItemNav[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Menu principal">
      {itens.map((it) => {
        const ativo =
          it.ativoEm === "exato" ? path === it.href : it.ativoEm === "prefixo" ? path.startsWith(it.href) : false;
        return (
          <a key={it.href} href={it.href} className={ativo ? "on" : undefined} aria-current={ativo ? "page" : undefined}>
            <Icone nome={it.icone} />
            <span className="lb">{it.label}</span>
            <span className="sh">{it.curto}</span>
          </a>
        );
      })}
    </nav>
  );
}
