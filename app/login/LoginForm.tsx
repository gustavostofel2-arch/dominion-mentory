"use client";

import { useActionState } from "react";
import { pedirCodigo, validarCodigo, type Estado } from "./actions";

const INICIAL_EMAIL: Estado = { etapa: "email" };
const INICIAL_CODIGO: Estado = { etapa: "codigo" };

export default function LoginForm({ next }: { next: string }) {
  const [pedido, pedir, pedindo] = useActionState(pedirCodigo, INICIAL_EMAIL);
  const [validacao, validar, validando] = useActionState(validarCodigo, INICIAL_CODIGO);

  // A etapa "código" aparece depois que o e-mail foi aceito. Se a validação
  // falhar por código errado, continua na etapa do código.
  const noCodigo = pedido.etapa === "codigo" && validacao.etapa !== "email";
  const email = validacao.email ?? pedido.email ?? "";

  if (noCodigo) {
    return (
      <form action={validar} className="loginform" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        {validacao.erro ? (
          <div className="erro" role="alert">{validacao.erro}</div>
        ) : (
          pedido.info && <div className="ok" role="status">{pedido.info}</div>
        )}
        <div>
          <label htmlFor="codigo">Código de 6 dígitos</label>
          <input
            id="codigo"
            name="codigo"
            className="cod"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="000000"
            required
            autoFocus
          />
        </div>
        <button className="btn primary" type="submit" disabled={validando}>
          {validando ? "Entrando..." : "Entrar no sistema"}
        </button>
        <a className="lnk" href={`/login?next=${encodeURIComponent(next)}`} style={{ textDecoration: "underline", color: "var(--accent)", font: "500 .82rem var(--mono)" }}>
          Usar outro e-mail ou pedir novo código
        </a>
      </form>
    );
  }

  const erro = validacao.etapa === "email" && validacao.erro ? validacao.erro : pedido.erro;
  return (
    <form action={pedir} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {erro && <div className="erro" role="alert">{erro}</div>}
      <div>
        <label htmlFor="email">E-mail da compra</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          defaultValue={pedido.email ?? ""}
          required
          autoFocus
        />
      </div>
      <button className="btn primary" type="submit" disabled={pedindo}>
        {pedindo ? "Enviando código..." : "Receber código por e-mail"}
      </button>
    </form>
  );
}
