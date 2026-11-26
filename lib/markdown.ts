import type { No } from "@/lib/doc";

/**
 * Converte texto com marcações de markdown (como o que vem de IA ou de anotações) em blocos do editor.
 * Assim, quem cola "**negrito**" ou "# Título" recebe o texto já formatado, sem asteriscos soltos.
 */

const TOKEN = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\s][^*\n]*\*|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+)/g;

type Marca = { type: string; attrs?: Record<string, unknown> };

function texto(t: string, marks: Marca[] = []): No | null {
  const limpo = t.replace(/\*{2,}/g, "");
  if (!limpo) return null;
  return marks.length ? { type: "text", text: limpo, marks } : { type: "text", text: limpo };
}

function inline(linha: string): No[] {
  const saida: No[] = [];
  for (const p of linha.split(TOKEN)) {
    if (!p) continue;
    let n: No | null = null;
    const md = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(p);
    if (/^\*\*[^*]+\*\*$/.test(p) || /^__[^_]+__$/.test(p)) n = texto(p.slice(2, -2), [{ type: "bold" }]);
    else if (/^\*[^*]+\*$/.test(p)) n = texto(p.slice(1, -1), [{ type: "italic" }]);
    else if (md) n = texto(md[1], [{ type: "link", attrs: { href: md[2] } }]);
    else if (/^https?:\/\//.test(p)) n = texto(p, [{ type: "link", attrs: { href: p } }]);
    else n = texto(p);
    if (n) saida.push(n);
  }
  return saida;
}

const ehLista = (l: string) => /^\s*[-*•]\s+/.test(l);
const ehNumerada = (l: string) => /^\s*\d+[.)]\s+/.test(l);

export function temMarkdown(t: string): boolean {
  return /(\*\*[^*\n]+\*\*|^\s{0,3}#{1,6}\s|^\s*[-*•]\s+\S|^\s*\d+[.)]\s+\S|\[[^\]\n]+\]\(https?:\/\/)/m.test(t);
}

export function markdownParaDoc(bruto: string): No {
  const linhas = bruto
    .replace(/\r\n/g, "\n")
    .split("\n")
    // sobras comuns de colagem: "****# TÍTULO ****"
    .map((l) => l.replace(/^\s*\*+(?=\s*#)/, "").replace(/\*{4,}/g, ""));

  const blocos: No[] = [];
  let i = 0;
  while (i < linhas.length) {
    const l = linhas[i];
    if (!l.trim()) {
      i++;
      continue;
    }
    const h = /^\s{0,3}(#{1,6})\s+(.*)$/.exec(l);
    if (h) {
      blocos.push({ type: "heading", attrs: { level: h[1].length <= 2 ? 2 : 3 }, content: inline(h[2].replace(/\*+\s*$/, "").trim()) });
      i++;
      continue;
    }
    if (ehLista(l) || ehNumerada(l)) {
      const numerada = ehNumerada(l);
      const itens: No[] = [];
      while (i < linhas.length && (numerada ? ehNumerada(linhas[i]) : ehLista(linhas[i]))) {
        const conteudo = linhas[i].replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "");
        itens.push({ type: "listItem", content: [{ type: "paragraph", content: inline(conteudo) }] });
        i++;
      }
      blocos.push({ type: numerada ? "orderedList" : "bulletList", content: itens });
      continue;
    }
    if (/^\s*>\s?/.test(l)) {
      const partes: string[] = [];
      while (i < linhas.length && /^\s*>\s?/.test(linhas[i])) partes.push(linhas[i++].replace(/^\s*>\s?/, ""));
      blocos.push({ type: "blockquote", content: [{ type: "paragraph", content: inline(partes.join(" ")) }] });
      continue;
    }
    // parágrafo: linhas seguidas viram quebras de linha
    const filhos: No[] = [];
    while (i < linhas.length && linhas[i].trim() && !/^\s{0,3}#{1,6}\s/.test(linhas[i]) && !ehLista(linhas[i]) && !ehNumerada(linhas[i])) {
      if (filhos.length) filhos.push({ type: "hardBreak" });
      filhos.push(...inline(linhas[i].trim()));
      i++;
    }
    blocos.push({ type: "paragraph", content: filhos });
  }
  return { type: "doc", content: blocos.length ? blocos : [{ type: "paragraph" }] };
}
