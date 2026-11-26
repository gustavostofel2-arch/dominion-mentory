"use client";

import { useRef, useState } from "react";
import { renderTexto } from "@/lib/texto";

const EMOJIS = ["🔥", "🚀", "🏆", "👏", "✅", "⚠️", "📢", "💡", "💰", "🎯", "📈", "⏰", "🎥", "❤️", "🙌", "👉"];

export default function EditorTexto({ nome = "corpo", valor = "" }: { nome?: string; valor?: string }) {
  const [texto, setTexto] = useState(valor);
  const [previa, setPrevia] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function envolver(antes: string, depois = antes, padrao = "texto") {
    const el = ref.current;
    if (!el) return;
    const ini = el.selectionStart;
    const fim = el.selectionEnd;
    const sel = texto.slice(ini, fim) || padrao;
    const novo = texto.slice(0, ini) + antes + sel + depois + texto.slice(fim);
    setTexto(novo);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ini + antes.length, ini + antes.length + sel.length);
    });
  }

  function iniciarLinha(prefixo: string) {
    const el = ref.current;
    if (!el) return;
    const ini = el.selectionStart;
    const comeco = texto.lastIndexOf("\n", ini - 1) + 1;
    setTexto(texto.slice(0, comeco) + prefixo + texto.slice(comeco));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ini + prefixo.length, ini + prefixo.length);
    });
  }

  function inserir(t: string) {
    const el = ref.current;
    if (!el) return setTexto(texto + t);
    const ini = el.selectionStart;
    setTexto(texto.slice(0, ini) + t + texto.slice(el.selectionEnd));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ini + t.length, ini + t.length);
    });
  }

  return (
    <div className="editor">
      <div className="tb" role="toolbar" aria-label="Formatar texto">
        <button type="button" onClick={() => envolver("**")} aria-label="Negrito"><b>B</b></button>
        <button type="button" onClick={() => envolver("*")} aria-label="Itálico"><i>I</i></button>
        <button type="button" onClick={() => iniciarLinha("# ")}>Título</button>
        <button type="button" onClick={() => iniciarLinha("## ")}>Subtítulo</button>
        <button type="button" onClick={() => iniciarLinha("- ")}>Lista</button>
        <button type="button" onClick={() => envolver("[", "](https://)", "texto do link")}>Link</button>
        <button type="button" className={previa ? "on" : undefined} onClick={() => setPrevia((p) => !p)}>
          {previa ? "Editar" : "Pré-visualizar"}
        </button>
      </div>
      <div className="emo" aria-label="Emojis">
        {EMOJIS.map((e) => (
          <button type="button" key={e} onClick={() => inserir(e)}>{e}</button>
        ))}
      </div>
      <textarea
        ref={ref}
        name={nome}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={8000}
        rows={9}
        hidden={previa}
        placeholder={"Escreva a postagem…\n\n**negrito**, *itálico*, # título, - lista, [link](https://...) e emojis."}
      />
      {previa && <div className="ptexto previa">{texto.trim() ? renderTexto(texto) : <p style={{ color: "var(--muted)" }}>Nada para mostrar ainda.</p>}</div>}
    </div>
  );
}
