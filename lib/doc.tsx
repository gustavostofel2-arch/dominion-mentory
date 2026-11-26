import type { ReactNode } from "react";
import { renderTexto } from "@/lib/texto";

/**
 * Texto rico do editor (Tiptap). É guardado como JSON, nunca como HTML solto:
 * o servidor só aceita os blocos e estilos da lista abaixo e a tela só desenha esses.
 * Postagens antigas em "texto simples" continuam funcionando (renderTexto).
 */

export type No = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: No[];
};

const BLOCOS = new Set(["doc", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "hardBreak", "horizontalRule", "text"]);
const ESTILOS = new Set(["bold", "italic", "underline", "strike", "link"]);
const MAX_NOS = 3000;

function linkOk(v: unknown): string | null {
  return typeof v === "string" && /^https?:\/\/[^\s]+$/i.test(v) ? v : null;
}

/** Valida e limpa o JSON vindo do navegador. Devolve null se for inválido. */
export function limparDoc(bruto: unknown): No | null {
  let contados = 0;
  function limpar(n: unknown, prof: number): No | null {
    if (!n || typeof n !== "object" || prof > 10 || ++contados > MAX_NOS) return null;
    const x = n as No;
    if (typeof x.type !== "string" || !BLOCOS.has(x.type)) return null;
    const saida: No = { type: x.type };
    if (x.type === "text") {
      if (typeof x.text !== "string" || !x.text) return null;
      saida.text = x.text.slice(0, 10000);
      const marks = (x.marks ?? [])
        .filter((m) => m && ESTILOS.has(m.type))
        .map((m) => {
          if (m.type === "link") {
            const href = linkOk(m.attrs?.href);
            return href ? { type: "link", attrs: { href } } : null;
          }
          return { type: m.type };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);
      if (marks.length) saida.marks = marks;
      return saida;
    }
    if (x.type === "heading") saida.attrs = { level: x.attrs?.level === 3 ? 3 : 2 };
    if (x.type === "orderedList") saida.attrs = { start: Number(x.attrs?.start) > 0 ? Math.min(Number(x.attrs?.start), 999) : 1 };
    if (Array.isArray(x.content)) {
      const filhos = x.content.map((c) => limpar(c, prof + 1)).filter((c): c is No => c !== null);
      if (filhos.length) saida.content = filhos;
    }
    return saida;
  }
  const doc = limpar(bruto, 0);
  return doc && doc.type === "doc" ? doc : null;
}

export function lerDoc(corpo: string): No | null {
  const t = corpo.trim();
  if (!t.startsWith("{")) return null;
  try {
    return limparDoc(JSON.parse(t));
  } catch {
    return null;
  }
}

function textoDe(n: No): string {
  if (n.type === "text") return n.text ?? "";
  const partes = (n.content ?? []).map(textoDe);
  const bloco = ["paragraph", "heading", "listItem", "blockquote"].includes(n.type);
  return partes.join(n.type === "doc" || n.type === "bulletList" || n.type === "orderedList" ? " " : "") + (bloco ? " " : "");
}

/** Texto puro (para resumos e notificações), seja JSON do editor ou texto simples. */
export function textoPuro(corpo: string): string {
  const doc = lerDoc(corpo);
  const t = doc ? textoDe(doc) : corpo.replace(/[*#>\[\]]/g, "");
  return t.replace(/\s+/g, " ").trim();
}

function marcar(texto: ReactNode, marks: No["marks"], chave: string): ReactNode {
  let el = texto;
  (marks ?? []).forEach((m, i) => {
    const k = `${chave}-m${i}`;
    if (m.type === "bold") el = <strong key={k}>{el}</strong>;
    else if (m.type === "italic") el = <em key={k}>{el}</em>;
    else if (m.type === "underline") el = <u key={k}>{el}</u>;
    else if (m.type === "strike") el = <s key={k}>{el}</s>;
    else if (m.type === "link") {
      const href = linkOk(m.attrs?.href);
      if (href)
        el = (
          <a key={k} href={href} target="_blank" rel="noopener noreferrer">
            {el}
          </a>
        );
    }
  });
  return el;
}

function desenhar(n: No, chave: string): ReactNode {
  const filhos = () => (n.content ?? []).map((c, i) => desenhar(c, `${chave}-${i}`));
  switch (n.type) {
    case "text":
      return <span key={chave}>{marcar(n.text, n.marks, chave)}</span>;
    case "paragraph":
      return <p key={chave}>{n.content?.length ? filhos() : <br />}</p>;
    case "heading":
      return n.attrs?.level === 3 ? <h4 key={chave}>{filhos()}</h4> : <h3 key={chave}>{filhos()}</h3>;
    case "bulletList":
      return <ul key={chave}>{filhos()}</ul>;
    case "orderedList":
      return <ol key={chave} start={Number(n.attrs?.start) || 1}>{filhos()}</ol>;
    case "listItem":
      return <li key={chave}>{filhos()}</li>;
    case "blockquote":
      return <blockquote key={chave}>{filhos()}</blockquote>;
    case "hardBreak":
      return <br key={chave} />;
    case "horizontalRule":
      return <hr key={chave} />;
    default:
      return null;
  }
}

/** Desenha o texto da postagem (JSON do editor ou texto simples antigo). */
export function renderConteudo(corpo: string): ReactNode {
  const doc = lerDoc(corpo);
  if (!doc) return renderTexto(corpo);
  return (doc.content ?? []).map((c, i) => desenhar(c, `d${i}`));
}

/** JSON vazio ou só com parágrafos em branco? */
export function conteudoVazio(corpo: string): boolean {
  return textoPuro(corpo).length === 0;
}
