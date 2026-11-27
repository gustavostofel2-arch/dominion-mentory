"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/painel/admin", label: "Visão geral" },
  { href: "/painel/admin/paginas", label: "Menu e páginas" },
  { href: "/painel/admin/avisos", label: "Avisos" },
  { href: "/painel/admin/posts", label: "Postagens" },
  { href: "/painel/admin/notificacoes", label: "Notificações" },
  { href: "/painel/admin/agenda", label: "Agenda" },
  { href: "/painel/admin/ferramentas", label: "Módulos e ferramentas" },
];

export default function AdminTabs() {
  const path = usePathname();
  return (
    <nav className="adm-tabs" aria-label="Admin">
      {ABAS.map((a) => (
        <Link key={a.href} href={a.href} className={path === a.href ? "on" : undefined} aria-current={path === a.href ? "page" : undefined}>
          {a.label}
        </Link>
      ))}
    </nav>
  );
}
