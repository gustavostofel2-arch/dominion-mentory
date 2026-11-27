"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { liberarAudio, tocarSom } from "@/lib/som";
import { mostrarToast } from "@/lib/toast";

type Evento = { t: "post" | "aviso" | "notificacao" | "comentario" | "curtida" | "atualizou"; postId?: string };

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

  useEffect(() => {
    caminho.current = pathname;
  }, [pathname]);

  // áudio só é liberado pelo navegador depois de um toque da pessoa
  useEffect(() => {
    const liberar = () => liberarAudio();
    window.addEventListener("pointerdown", liberar, { once: true });
    window.addEventListener("keydown", liberar, { once: true });
    // push chegando com o app aberto: toca o som da Dominion
    const doSW = (ev: MessageEvent) => {
      if (ev.data?.tipo === "dm-push" && !document.hidden) tocarSom();
    };
    navigator.serviceWorker?.addEventListener("message", doSW);
    return () => {
      window.removeEventListener("pointerdown", liberar);
      window.removeEventListener("keydown", liberar);
      navigator.serviceWorker?.removeEventListener("message", doSW);
    };
  }, []);

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
          if (!document.hidden) tocarSom();
          mostrarToast({ ...MENSAGEM[e.t], sub: "Toque para ver" });
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

  return null;
}
