"use client";

import { useRef, useState } from "react";

import { CATEGORIAS_EMOJI } from "@/lib/emojis";

/** Campo de texto (uma linha ou várias) com botão de emoji que insere onde o cursor está. */
export default function CampoEmoji({
  nome,
  rotulo,
  max,
  placeholder,
  varias,
  obrigatorio,
  inicial,
}: {
  nome: string;
  rotulo: string;
  max: number;
  placeholder?: string;
  varias?: boolean;
  obrigatorio?: boolean;
  inicial?: string;
}) {
  const [valor, setValor] = useState(inicial ?? "");
  const [aberto, setAberto] = useState(false);
  const [cat, setCat] = useState(0);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  function inserir(e: string) {
    const el = ref.current;
    const ini = el?.selectionStart ?? valor.length;
    const fim = el?.selectionEnd ?? valor.length;
    const novo = (valor.slice(0, ini) + e + valor.slice(fim)).slice(0, max);
    setValor(novo);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = Math.min(ini + e.length, novo.length);
      el?.setSelectionRange(pos, pos);
    });
  }

  const comum = {
    name: nome,
    value: valor,
    maxLength: max,
    placeholder,
    required: obrigatorio,
    onChange: (ev: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setValor(ev.target.value),
  };

  return (
    <div className="fld full campo-emo">
      <label>{rotulo}</label>
      {varias ? <textarea ref={ref} {...comum} /> : <input ref={ref} type="text" {...comum} />}
      <button type="button" className="emo-abrir" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} title="Inserir emoji">😀 Emoji</button>
      {aberto && (
        <div className="emo-painel" aria-label="Emojis">
          <div className="emo-abas">
            {CATEGORIAS_EMOJI.map((c, i) => (
              <button type="button" key={c.nome} className={i === cat ? "on" : ""} title={c.nome} onMouseDown={(ev) => ev.preventDefault()} onClick={() => setCat(i)}>{c.icone}</button>
            ))}
          </div>
          <div className="emo-grade">
            {CATEGORIAS_EMOJI[cat].lista.map((e) => (
              <button type="button" key={e} onMouseDown={(ev) => ev.preventDefault()} onClick={() => inserir(e)}>{e}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
