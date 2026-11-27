"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CamposPost, { type PostEditavel } from "./CamposPost";
import { criarPost, salvarPost } from "../painel/admin/actions";

/** Janela de edição da postagem (abre pelo menu ⋯). No celular ocupa a tela toda. */
export default function EditarPostModal({ post, retorno, destino, aoFechar }: { post?: PostEditavel; retorno: string; destino?: string; aoFechar: () => void }) {
  // Ao enviar, a janela some na hora, mas o formulário continua montado até a ação terminar.
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !enviando && aoFechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aoFechar, enviando]);

  useEffect(() => {
    const antes = document.body.style.overflow;
    if (!enviando) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, [enviando]);

  useEffect(() => {
    if (!enviando) return;
    const t = setTimeout(aoFechar, 6000);
    return () => clearTimeout(t);
  }, [enviando, aoFechar]);

  const janela = (
    <div
      className="modal-fundo"
      role="presentation"
      hidden={enviando}
      onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={post ? "Editar postagem" : "Nova postagem"}>
        <header className="modal-topo">
          <b>{post ? "Editar postagem" : "Nova postagem"}</b>
          <button type="button" className="x" aria-label="Fechar" onClick={aoFechar}>×</button>
        </header>
        <form action={post ? salvarPost : criarPost} className="modal-corpo" onSubmit={() => setEnviando(true)}>
          <CamposPost post={post} retorno={retorno} destino={destino} />
          <div className="modal-rodape">
            <button type="button" className="btn" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="btn primary">{post ? "Salvar alterações" : "Publicar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
  return typeof document === "undefined" ? janela : createPortal(janela, document.body);
}
