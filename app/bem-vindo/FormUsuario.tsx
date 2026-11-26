"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { criarPerfil, usuarioDisponivel, type EstadoPerfil } from "./actions";

export default function FormUsuario() {
  const [estado, acao, pendente] = useActionState<EstadoPerfil, FormData>(criarPerfil, {});
  const [valor, setValor] = useState("");
  const [check, setCheck] = useState<{ ok: boolean; msg: string } | null>(null);
  const [conferindo, setConferindo] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const v = valor.trim();
    if (!v) {
      setCheck(null);
      return;
    }
    const minha = ++seq.current;
    setConferindo(true);
    const t = setTimeout(async () => {
      try {
        const r = await usuarioDisponivel(v);
        if (minha === seq.current) setCheck(r);
      } finally {
        if (minha === seq.current) setConferindo(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [valor]);

  return (
    <form action={acao} className="bv-form">
      <label htmlFor="usuario">Seu @</label>
      <div className={`bv-campo${check ? (check.ok ? " ok" : " ruim") : ""}`}>
        <span aria-hidden="true">@</span>
        <input
          id="usuario"
          name="usuario"
          type="text"
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          required
          maxLength={21}
          placeholder="seunome"
          value={valor}
          onChange={(e) => setValor(e.target.value.toLowerCase().replace(/[^a-z0-9._@]/g, ""))}
        />
      </div>
      <p className={`bv-dica${check ? (check.ok ? " ok" : " ruim") : ""}`} aria-live="polite">
        {conferindo ? "Conferindo…" : check ? check.msg : "De 3 a 20 caracteres: letras, números, ponto e sublinhado."}
      </p>
      {estado.erro && <div className="erro-in">{estado.erro}</div>}
      <button className="btn primary" type="submit" disabled={pendente || (check ? !check.ok : false)}>
        {pendente ? "Salvando…" : "Entrar na comunidade"}
      </button>
    </form>
  );
}
