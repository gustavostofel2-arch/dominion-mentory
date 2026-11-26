"use client";

import { useState } from "react";
import ComentarioForm from "./ComentarioForm";

/** "Responder": abre a caixinha logo abaixo do comentário, já com o @ de quem está sendo respondido. */
export function ResponderBotao({ postId, parentId, usuario }: { postId: string; parentId: string; usuario: string | null }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" className="resp-btn" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        {aberto ? "Cancelar" : "Responder"}
      </button>
      {aberto && (
        <div className="resp-form">
          <ComentarioForm
            postId={postId}
            parentId={parentId}
            inicial={usuario ? `@${usuario} ` : ""}
            autoFoco
            aoEnviar={() => setAberto(false)}
            placeholder="Escreva sua resposta…"
          />
        </div>
      )}
    </>
  );
}

/** "Ver N respostas" / "Ocultar respostas". Os comentários-filhos chegam já prontos do servidor. */
export function Respostas({ n, children }: { n: number; children: React.ReactNode }) {
  const [aberto, setAberto] = useState(n <= 2);
  return (
    <div className="respostas">
      <button type="button" className="ver-resp" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        <span aria-hidden="true">—</span> {aberto ? "Ocultar respostas" : `Ver ${n} ${n === 1 ? "resposta" : "respostas"}`}
      </button>
      {aberto && <ul>{children}</ul>}
    </div>
  );
}
