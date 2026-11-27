"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";

// o editor só é baixado quando o admin abre a janela
const EditarPostModal = dynamic(() => import("./EditarPostModal"), { ssr: false });

/** Botão de admin: cria a postagem numa janela, SEM sair da página em que está. */
export default function NovaPostagem({ rotulo = "+ Nova postagem", grande = false }: { rotulo?: string; grande?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const retorno = usePathname();
  return (
    <>
      <button type="button" className={`btn primary${grande ? "" : " sm"}`} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
      {aberto && <EditarPostModal retorno={retorno} aoFechar={() => setAberto(false)} />}
    </>
  );
}
