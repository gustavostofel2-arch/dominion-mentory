"use client";

import { useActionState, useEffect, useRef } from "react";
import { comentar, type EstadoComentario } from "../painel/novidades/actions";

export default function ComentarioForm({
  postId,
  parentId,
  inicial = "",
  autoFoco = false,
  aoEnviar,
  placeholder = "Escreva um comentário…",
}: {
  postId: string;
  parentId?: string;
  inicial?: string;
  autoFoco?: boolean;
  aoEnviar?: () => void;
  placeholder?: string;
}) {
  const [estado, acao, pendente] = useActionState<EstadoComentario, FormData>(comentar, {});
  const ref = useRef<HTMLFormElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (estado.ok) {
      ref.current?.reset();
      aoEnviar?.();
    }
  }, [estado.ok, aoEnviar]);

  useEffect(() => {
    if (autoFoco && campo.current) {
      campo.current.focus();
      const n = campo.current.value.length;
      campo.current.setSelectionRange(n, n);
    }
  }, [autoFoco]);

  return (
    <form action={acao} ref={ref} className={`comentar${parentId ? " resposta" : ""}`}>
      <input type="hidden" name="post_id" value={postId} />
      {parentId && <input type="hidden" name="parent_id" value={parentId} />}
      <textarea
        ref={campo}
        name="texto"
        required
        maxLength={500}
        rows={parentId ? 1 : 2}
        defaultValue={inicial}
        placeholder={placeholder}
        aria-label={parentId ? "Sua resposta" : "Seu comentário"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ref.current?.requestSubmit();
        }}
      />
      <div className="acts" style={{ marginTop: 8 }}>
        <button className="btn primary sm" type="submit" disabled={pendente}>
          {pendente ? "Enviando…" : parentId ? "Responder" : "Comentar"}
        </button>
        {estado.erro && <span className="erro-in">{estado.erro}</span>}
      </div>
    </form>
  );
}
