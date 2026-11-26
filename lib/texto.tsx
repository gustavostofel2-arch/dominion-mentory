import type { ReactNode } from "react";

/**
 * Texto formatado simples e SEGURO (nunca injeta HTML):
 *   # Título   ## Subtítulo   **negrito**   *itálico*   - lista   [texto](https://link)   https://link solto
 * Emojis funcionam direto. Linhas em branco separam parágrafos.
 */

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+)/g;

function inline(texto: string, chave: string): ReactNode[] {
  const partes = texto.split(INLINE);
  return partes.map((p, i) => {
    const k = `${chave}-${i}`;
    if (!p) return null;
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={k}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={k}>{p.slice(1, -1)}</em>;
    const md = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(p);
    if (md)
      return (
        <a key={k} href={md[2]} target="_blank" rel="noopener noreferrer">
          {md[1]}
        </a>
      );
    if (/^https?:\/\//.test(p))
      return (
        <a key={k} href={p} target="_blank" rel="noopener noreferrer">
          {p}
        </a>
      );
    return p;
  });
}

export function renderTexto(texto: string): ReactNode {
  const blocos = texto.replace(/\r\n/g, "\n").trim().split(/\n{2,}/).filter(Boolean);
  return blocos.map((b, bi) => {
    const k = `b${bi}`;
    const linhas = b.split("\n");
    const h = /^(#{1,2})\s+(.+)$/.exec(linhas[0]);
    if (h && linhas.length === 1) return h[1].length === 1 ? <h3 key={k}>{inline(h[2], k)}</h3> : <h4 key={k}>{inline(h[2], k)}</h4>;
    if (linhas.every((l) => /^\s*[-•]\s+/.test(l))) {
      return (
        <ul key={k}>
          {linhas.map((l, li) => (
            <li key={li}>{inline(l.replace(/^\s*[-•]\s+/, ""), `${k}-${li}`)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={k}>
        {linhas.map((l, li) => (
          <span key={li}>
            {li > 0 && <br />}
            {inline(l, `${k}-${li}`)}
          </span>
        ))}
      </p>
    );
  });
}
