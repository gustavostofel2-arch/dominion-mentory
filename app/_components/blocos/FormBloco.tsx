"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BLOCOS, ICONES_PAGINA, comPadrao, type Campo, type Dados, type TipoBloco } from "@/lib/blocos";
import { salvarBlocoRapido } from "../../painel/paginas/actions";
import { previaBloco } from "../../painel/paginas/previa";
import { mostrarToast } from "@/lib/toast";
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
          <textarea className="area-grande" value={String(valor ?? "")} maxLength={c.max ?? 1000} placeholder={c.placeholder} onChange={(e) => mudar(e.target.value)} />
          <small className="contador">{String(valor ?? "").length} / {c.max ?? 1000} caracteres</small>
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

const LARGURA_PREVIA = 1040;

/** Prévia ao vivo: mostra o bloco como os alunos vão ver (em tamanho de computador, reduzido para caber ao lado). */
function Previa({ tipo, dados, slug }: { tipo: TipoBloco; dados: Dados; slug: string }) {
  const [vista, setVista] = useState<ReactNode>(null);
  const [vazia, setVazia] = useState(false);
  const [, comecar] = useTransition();
  const [escala, setEscala] = useState(0.5);
  const [altura, setAltura] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const miolo = useRef<HTMLDivElement>(null);
  const json = JSON.stringify(dados);

  // atualiza 0,5 s depois da última tecla
  useEffect(() => {
    const t = setTimeout(() => {
      comecar(async () => {
        try {
          const r = await previaBloco(tipo, json, slug);
          setVista(r);
          setVazia(r === null);
        } catch {
          setVazia(true);
        }
      });
    }, 450);
    return () => clearTimeout(t);
  }, [tipo, json, slug]);

  const medir = useCallback(() => {
    if (caixa.current) setEscala(Math.min(1, caixa.current.clientWidth / LARGURA_PREVIA));
    if (miolo.current) setAltura(miolo.current.scrollHeight);
  }, []);
  useEffect(() => {
    medir();
    const o = new ResizeObserver(medir);
    if (caixa.current) o.observe(caixa.current);
    if (miolo.current) o.observe(miolo.current);
    return () => o.disconnect();
  }, [medir, vista]);

  return (
    <div className="previa-caixa" ref={caixa}>
      {vazia && <p className="dica">Preencha os campos para ver a prévia.</p>}
      <div className="previa-moldura" style={{ height: altura * escala }}>
        <div className="previa-miolo" ref={miolo} style={{ width: LARGURA_PREVIA, transform: `scale(${escala})` }}>
          {vista}
        </div>
      </div>
    </div>
  );
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
  const [erro, setErro] = useState("");
  const [salvando, salvar] = useTransition();
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  const slug = caminho === "/painel" ? "inicio" : caminho.split("/")[2] ?? "";

  function fechar() {
    // bloco recém-criado abre sozinho pelo "?novo=": limpa para não reabrir
    if (params.get("novo")) router.replace(caminho, { scroll: false });
    aoFechar();
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    salvar(async () => {
      const r = await salvarBlocoRapido(bloco.id, JSON.stringify(dados));
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      mostrarToast({ texto: "Bloco salvo.", tipo: "ok" });
      router.refresh(); // atualiza só o conteúdo, sem recarregar a página nem voltar ao topo
      fechar();
    });
  }

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !enviando && !salvando && fechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aoFechar, enviando, salvando]);

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
    <div className="modal-fundo" role="presentation" hidden={enviando} onMouseDown={(e) => e.target === e.currentTarget && !salvando && fechar()}>
      <div className="modal larga" role="dialog" aria-modal="true" aria-label={`Editar bloco ${def.nome}`}>
        <header className="modal-topo">
          <b>{def.nome}</b>
          <button type="button" className="x" aria-label="Fechar" onClick={fechar}>×</button>
        </header>
        <form className="modal-duas" onSubmit={enviar}>
          <div className="modal-corpo">
            <p className="dica" style={{ marginBottom: 14 }}>{def.descricao}</p>
            <div className="campos-post">
              {def.campos.length === 0 && <p className="dica">Este bloco não tem opções para editar.</p>}
              {def.campos.map((c) => (
                <CampoUI key={c.nome} c={c} valor={dados[c.nome]} mudar={(v) => setDados((d) => ({ ...d, [c.nome]: v }))} modulos={modulos} />
              ))}
            </div>
            {erro && <p className="erro-in" role="alert" style={{ marginTop: 12 }}>{erro}</p>}
            <div className="modal-rodape">
              <button type="button" className="btn" onClick={fechar} disabled={salvando}>Cancelar</button>
              <button type="submit" className="btn primary" disabled={salvando}>{salvando ? "Salvando…" : "Salvar bloco"}</button>
            </div>
          </div>
          <aside className="previa-painel" aria-label="Prévia ao vivo">
            <div className="previa-topo"><b>Prévia ao vivo</b><span>como os alunos vão ver</span></div>
            <Previa tipo={bloco.tipo} dados={dados} slug={slug} />
          </aside>
        </form>
      </div>
    </div>
  );
  // em portal: fora das molduras da página, para ficar SEMPRE por cima do menu e das barras do topo
  return typeof document === "undefined" ? janela : createPortal(janela, document.body);
}
