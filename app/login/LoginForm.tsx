"use client";

import { useActionState } from "react";
import { entrar, type Estado } from "./actions";

const INICIAL: Estado = {};

export default function LoginForm({ next }: { next: string }) {
  const [estado, acao, enviando] = useActionState(entrar, INICIAL);

  return (
    <form action={acao} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="next" value={next} />
      {estado.erro && (
        <div className="erro" role="alert">
          {estado.erro}
          {estado.detalhe && (
            <div style={{ marginTop: 8, font: "400 .72rem var(--mono)", opacity: 0.85, wordBreak: "break-word" }}>
              Detalhe técnico: {estado.detalhe}
            </div>
          )}
        </div>
      )}
      <div>
        <label htmlFor="email">E-mail da compra</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          defaultValue={estado.email ?? ""}
          required
          autoFocus
        />
      </div>
      <button className="btn primary" type="submit" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar no sistema"}
      </button>
    </form>
  );
}
