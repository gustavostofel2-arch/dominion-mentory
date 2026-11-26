"use client";

import { useEffect, useState } from "react";
import { BLOCOS, ICONES_PAGINA, comPadrao, type Campo, type Dados, type TipoBloco } from "@/lib/blocos";
import { salvarBloco } from "../../painel/paginas/actions";
import EditorTexto from "../EditorTexto";
import { Icone } from "../Icone";
import CampoImagem from "./CampoImagem";

export type ModuloOpcao = { id: string; titulo: string };

const novaChave = () => Math.random().toString(36).slice(2, 9);

function isoParaCampo(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(" ", "T").slice(0, 16);
}
const campoParaIso = (v: string) => {
  if (!v) return "";
  const d = new Date(`${v}:00-03:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
};

/** Um campo do formulário, desenhado conforme o tipo definido em lib/blocos.ts. */
function CampoUI({ c, valor, mudar, modulos }: { c: Campo; valor: unknown; mudar: (v: unknown) => void; modulos: ModuloOpcao[] }) {
  const rotulo = <label>{c.rotulo}</label>;
  const dica = c.dica ? <p className="dica">{c.dica}</p> : null;

  switch (c.k) {
    case "texto":
      return (
        <div className="fld">
          {rotulo}
          <input type="text" value={String(valor ?? "")} maxLength={c.max ?? 200} placeholder={c.placeholder} onChange={(e) => mudar(e.target.value)} />
          {dica}
        </div>
      );
    case "area":
      return (
        <div className="fld">
          {rotulo}
          <textarea value={String(valor ?? "")} maxLength={c.max ?? 1000} placeholder={c.placeholder} onChange={(e) => mudar(e.target.value)} />
          {dica}
        </div>
      );
    case "url":
      return (
        <div className="fld">
          {rotulo}
          <input type="text" inputMode="url" value={String(valor ?? "")} placeholder={c.placeholder ?? "https://… ou /painel/…"} onChange={(e) => mudar(e.target.value)} />
          {dica}
        </div>
      );
    case "num":
      return (
        <div className="fld">
          {rotulo}
          <input type="number" min={c.min} max={c.max} value={Number(valor ?? c.min)} onChange={(e) => mudar(Number(e.target.value))} />
          {dica}
        </div>
      );
    case "sel":
      return (
        <div className="fld">
          {rotulo}
          <select value={String(valor ?? c.opcoes[0].v)} onChange={(e) => mudar(e.target.value)}>
            {c.opcoes.map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
          </select>
          {dica}
        </div>
      );
    case "sim":
      return (
        <label className="chk">
          <input type="checkbox" checked={valor === true} onChange={(e) => mudar(e.target.checked)} /> {c.rotulo}
        </label>
      );
    case "data":
      return (
        <div className="fld">
          {rotulo}
          <input type="datetime-local" value={isoParaCampo(valor)} onChange={(e) => mudar(campoParaIso(e.target.value))} />
          <p className="dica">Horário de Brasília.</p>
        </div>
      );
    case "icone":
      return (
        <div className="fld">
          {rotulo}
          <div className="icones-grade" role="radiogroup" aria-label={c.rotulo}>
            {ICONES_PAGINA.map((nome) => (
              <button
                type="button"
                key={nome}
                role="radio"
                aria-checked={valor === nome}
                aria-label={nome}
                className={valor === nome ? "on" : undefined}
                onClick={() => mudar(nome)}
              >
                <Icone nome={nome} />
              </button>
            ))}
          </div>
        </div>
      );
    case "modulo":
      return (
        <div className="fld">
          {rotulo}
          <select value={String(valor ?? "todos")} onChange={(e) => mudar(e.target.value)}>
            <option value="todos">Todos os módulos</option>
            {modulos.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
          </select>
          {dica}
        </div>
      );
    case "imagem":
      return (
        <div className="fld">
          {rotulo}
          <CampoImagem valor={String(valor ?? "")} aoMudar={mudar} formatos={c.formatos} />
        </div>
      );
    case "rico":
      return (
        <div className="fld">
          {rotulo}
          <EditorTexto valor={String(valor ?? "")} aoMudar={(j) => mudar(j)} nome={`__${c.nome}`} />
        </div>
      );
    case "lista": {
      const itens = (Array.isArray(valor) ? valor : []) as (Dados & { _k?: string })[];
      const trocar = (i: number, nome: string, v: unknown) => mudar(itens.map((it, k) => (k === i ? { ...it, [nome]: v } : it)));
      const mover = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= itens.length) return;
        const cp = itens.slice();
        [cp[i], cp[j]] = [cp[j], cp[i]];
        mudar(cp);
      };
      return (
        <div className="lista-campo">
          <label>{c.rotulo}</label>
          {itens.map((it, i) => (
            <div className="lista-item" key={it._k ?? i}>
              <div className="li-topo">
                <b>{c.rotuloItem} {i + 1}</b>
                <span>
                  <button type="button" className="btn mini" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                  <button type="button" className="btn mini" onClick={() => mover(i, 1)} disabled={i === itens.length - 1} aria-label="Descer">↓</button>
                  <button type="button" className="btn danger mini" onClick={() => mudar(itens.filter((_, k) => k !== i))} aria-label="Remover">Remover</button>
                </span>
              </div>
              <div className="li-campos">
                {c.item.map((sub) => (
                  <CampoUI key={sub.nome} c={sub} valor={it[sub.nome]} mudar={(v) => trocar(i, sub.nome, v)} modulos={modulos} />
                ))}
              </div>
            </div>
          ))}
          {itens.length < c.max && (
            <button type="button" className="btn mini" onClick={() => mudar([...itens, { ...c.novo, _k: novaChave() }])}>
              + Adicionar {c.rotuloItem.toLowerCase()}
            </button>
          )}
        </div>
      );
    }
  }
}

/** Janela para editar um bloco. O formulário é gerado a partir da descrição do tipo. */
export default function FormBloco({
  bloco,
  retorno,
  modulos,
  aoFechar,
}: {
  bloco: { id: string; tipo: TipoBloco; dados: Dados };
  retorno: string;
  modulos: ModuloOpcao[];
  aoFechar: () => void;
}) {
  const def = BLOCOS[bloco.tipo];
  const [dados, setDados] = useState<Dados>(() => {
    const d = comPadrao(bloco.tipo, bloco.dados);
    // dá uma chave única para cada item de lista (mantém os editores estáveis ao mover/remover)
    for (const c of def.campos) {
      if (c.k === "lista" && Array.isArray(d[c.nome])) d[c.nome] = (d[c.nome] as Dados[]).map((it) => ({ ...it, _k: novaChave() }));
    }
    return d;
  });
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

  return (
    <div className="modal-fundo" role="presentation" hidden={enviando} onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={`Editar bloco ${def.nome}`}>
        <header className="modal-topo">
          <b>{def.nome}</b>
          <button type="button" className="x" aria-label="Fechar" onClick={aoFechar}>×</button>
        </header>
        <form action={salvarBloco} className="modal-corpo" onSubmit={() => setEnviando(true)}>
          <input type="hidden" name="id" value={bloco.id} />
          <input type="hidden" name="retorno" value={retorno} />
          <input type="hidden" name="dados" value={JSON.stringify(dados)} />
          <p className="dica" style={{ marginBottom: 14 }}>{def.descricao}</p>
          <div className="campos-post">
            {def.campos.length === 0 && <p className="dica">Este bloco não tem opções para editar.</p>}
            {def.campos.map((c) => (
              <CampoUI key={c.nome} c={c} valor={dados[c.nome]} mudar={(v) => setDados((d) => ({ ...d, [c.nome]: v }))} modulos={modulos} />
            ))}
          </div>
          <div className="modal-rodape">
            <button type="button" className="btn" onClick={aoFechar}>Cancelar</button>
            <button type="submit" className="btn primary">Salvar bloco</button>
          </div>
        </form>
      </div>
    </div>
  );
}
