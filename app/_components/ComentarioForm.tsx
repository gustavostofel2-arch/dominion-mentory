"use client";

import { useActionState, useEffect, useRef } from "react";
import { comentar, type EstadoComentario } from "../painel/novidades/actions";

export default function ComentarioForm({ postId }: { postId: string }) {
  const [estado, acao, pendente] = useActionState<EstadoComentario, FormData>(comentar, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado.ok) ref.current?.reset();
  }, [estado.ok]);

  return (
    <form action={acao} ref={ref} className="comentar">
      <input type="hidden" name="post_id" value={postId} />
      <textarea name="texto" required maxLength={500} rows={2} placeholder="Escreva um comentário…" aria-label="Seu comentário" />
      <div className="acts" style={{ marginTop: 8 }}>
        <button className="btn primary sm" type="submit" disabled={pendente}>
          {pendente ? "Enviando…" : "Comentar"}
        </button>
        {estado.erro && <span className="erro-in">{estado.erro}</span>}
      </div>
    </form>
  );
}
