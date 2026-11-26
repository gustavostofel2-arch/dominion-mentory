"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Icone } from "./Icone";

type Evento = { t: "post" | "aviso" | "notificacao" | "comentario" | "curtida" | "atualizou"; postId?: string };
type Toast = { id: number; texto: string; link: string; icone: string };

const MENSAGEM: Record<string, { texto: string; link: string; icone: string }> = {
  post: { texto: "Nova postagem em Novidades", link: "/painel/novidades", icone: "news" },
  aviso: { texto: "Novo aviso no Início", link: "/painel", icone: "megaphone" },
  notificacao: { texto: "Você tem uma nova notificação", link: "/painel/notificacoes", icone: "bell" },
};

/** Escuta o canal em tempo real e atualiza a tela sozinha, sem recarregar. */
export default function TempoReal({ url, chave }: { url: string | null; chave: string | null }) {
  const router = useRouter();
  const caminho = useRef("");
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    caminho.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!url || !chave) return;
    const sb = createClient(url, chave, { auth: { persistSession: false, autoRefreshToken: false } });

    const atualizar = (ms: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), ms);
    };

    const canal = sb
      .channel("comunidade", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "novo" }, ({ payload }) => {
        const e = payload as Evento;
        if (!e?.t) return;
        const naComunidade = caminho.current.startsWith("/painel/novidades") || caminho.current === "/painel";
        if (e.t === "post" || e.t === "aviso" || e.t === "notificacao") {
          atualizar(500);
          const m = MENSAGEM[e.t];
          const id = Date.now() + Math.random();
          setToasts((t) => [...t.slice(-2), { id, ...m }]);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 7000);
          if (e.t === "notificacao") window.dispatchEvent(new CustomEvent("dm:nova-notificacao"));
        } else if (e.t === "atualizou" && caminho.current.startsWith("/painel")) {
          atualizar(600);
        } else if (e.t === "comentario" && caminho.current.startsWith("/painel/novidades")) {
          atualizar(400);
        } else if (e.t === "curtida" && naComunidade) {
          atualizar(2000);
        }
      })
      .subscribe();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      sb.removeChannel(canal);
    };
  }, [url, chave, router]);

  if (!toasts.length) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <a
          key={t.id}
          className="toast"
          href={t.link}
          onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
        >
          <span className="toast-ic"><Icone nome={t.icone} /></span>
          <span className="toast-tx"><b>{t.texto}</b><small>Toque para ver</small></span>
        </a>
      ))}
    </div>
  );
}
