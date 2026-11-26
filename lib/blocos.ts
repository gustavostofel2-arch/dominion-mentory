import { ICONES } from "@/lib/conteudo";
import { limparDoc, conteudoVazio } from "@/lib/doc";

/**
 * Tipos de bloco das páginas. Cada tipo descreve os seus campos; o formulário do Admin é gerado
 * daqui e o servidor usa a mesma descrição para validar e limpar o que chega (nada de HTML solto).
 */

export type Dados = Record<string, unknown>;
export type FormatoImagem = "quadrada" | "retrato" | "banner" | "original";

type Base = { nome: string; rotulo: string; dica?: string };
export type Campo =
  | (Base & { k: "texto"; max?: number; placeholder?: string })
  | (Base & { k: "area"; max?: number; placeholder?: string })
  | (Base & { k: "rico" })
  | (Base & { k: "imagem"; formatos: FormatoImagem[] })
  | (Base & { k: "url"; placeholder?: string })
  | (Base & { k: "num"; min: number; max: number })
  | (Base & { k: "sel"; opcoes: { v: string; r: string }[] })
  | (Base & { k: "sim" })
  | (Base & { k: "data" })
  | (Base & { k: "icone" })
  | (Base & { k: "modulo" })
  | (Base & { k: "lista"; item: Campo[]; max: number; rotuloItem: string; novo: Dados });

export type TipoBloco =
  | "saudacao"
  | "titulo"
  | "texto"
  | "imagem"
  | "imagem_texto"
  | "faq"
  | "cartoes"
  | "botoes"
  | "ferramentas"
  | "feed"
  | "avisos"
  | "corrida"
  | "separador";

export type DefBloco = { tipo: TipoBloco; nome: string; descricao: string; icone: string; campos: Campo[]; padrao: Dados };

const T = (nome: string, rotulo: string, extra: Partial<Extract<Campo, { k: "texto" }>> = {}): Campo => ({ k: "texto", nome, rotulo, ...extra });
const A = (nome: string, rotulo: string, extra: Partial<Extract<Campo, { k: "area" }>> = {}): Campo => ({ k: "area", nome, rotulo, ...extra });
const U = (nome: string, rotulo: string, extra: Partial<Extract<Campo, { k: "url" }>> = {}): Campo => ({ k: "url", nome, rotulo, ...extra });
const S = (nome: string, rotulo: string, opcoes: [string, string][], dica?: string): Campo => ({
  k: "sel",
  nome,
  rotulo,
  dica,
  opcoes: opcoes.map(([v, r]) => ({ v, r })),
});

export const BLOCOS: Record<TipoBloco, DefBloco> = {
  saudacao: {
    tipo: "saudacao",
    nome: "Saudação",
    descricao: "“Olá, [nome]” com uma frase de boas-vindas.",
    icone: "home",
    campos: [T("etiqueta", "Texto pequeno", { max: 60 }), A("texto", "Frase de boas-vindas", { max: 300 })],
    padrao: { etiqueta: "Painel do mentorado", texto: "Bem-vindo! Aqui está tudo da mentoria em um lugar só." },
  },
  titulo: {
    tipo: "titulo",
    nome: "Título de seção",
    descricao: "Um título com subtítulo para separar partes da página.",
    icone: "book",
    campos: [
      T("texto", "Título", { max: 120 }),
      A("subtitulo", "Subtítulo (opcional)", { max: 300 }),
      S("alinhamento", "Alinhamento", [["esquerda", "À esquerda"], ["centro", "Centralizado"]]),
    ],
    padrao: { texto: "Novo título", subtitulo: "", alinhamento: "esquerda" },
  },
  texto: {
    tipo: "texto",
    nome: "Texto",
    descricao: "Texto formatado: negrito, listas, links, emojis. Pode ficar solto, numa caixa ou em destaque.",
    icone: "news",
    campos: [
      { k: "rico", nome: "corpo", rotulo: "Texto" },
      S("estilo", "Aparência", [["normal", "Solto na página"], ["caixa", "Dentro de uma caixa"], ["destaque", "Caixa em destaque (dourada)"]]),
    ],
    padrao: { corpo: "", estilo: "normal" },
  },
  imagem: {
    tipo: "imagem",
    nome: "Imagem",
    descricao: "Uma imagem ou banner, com legenda e link opcionais.",
    icone: "layers",
    campos: [
      { k: "imagem", nome: "imagem", rotulo: "Imagem", formatos: ["banner", "quadrada", "retrato", "original"] },
      T("legenda", "Legenda (opcional)", { max: 200 }),
      U("link", "Link ao tocar (opcional)"),
      S("largura", "Largura", [["cheia", "Toda a largura"], ["media", "Média (centralizada)"]]),
    ],
    padrao: { imagem: "", legenda: "", link: "", largura: "cheia" },
  },
  imagem_texto: {
    tipo: "imagem_texto",
    nome: "Imagem com texto",
    descricao: "Imagem e texto juntos: em cima, ao lado ou ao fundo.",
    icone: "bag",
    campos: [
      { k: "imagem", nome: "imagem", rotulo: "Imagem", formatos: ["quadrada", "banner", "retrato", "original"] },
      S("posicao", "Posição da imagem", [["topo", "Em cima do texto"], ["esquerda", "À esquerda"], ["direita", "À direita"], ["fundo", "Ao fundo (texto por cima)"]]),
      T("titulo", "Título", { max: 120 }),
      { k: "rico", nome: "corpo", rotulo: "Texto" },
      T("botao_texto", "Texto do botão (opcional)", { max: 40 }),
      U("botao_url", "Link do botão"),
    ],
    padrao: { imagem: "", posicao: "esquerda", titulo: "Título", corpo: "", botao_texto: "", botao_url: "" },
  },
  faq: {
    tipo: "faq",
    nome: "Perguntas e respostas",
    descricao: "Lista que abre e fecha (como as regras). Cada item tem pergunta e resposta formatada.",
    icone: "gauge",
    campos: [
      T("titulo", "Título da lista (opcional)", { max: 120 }),
      { k: "sim", nome: "numerar", rotulo: "Numerar os itens" },
      {
        k: "lista",
        nome: "itens",
        rotulo: "Itens",
        rotuloItem: "Item",
        max: 40,
        novo: { pergunta: "Nova pergunta", resposta: "", selo: "" },
        item: [
          T("pergunta", "Pergunta ou título", { max: 200 }),
          { k: "rico", nome: "resposta", rotulo: "Resposta" },
          T("selo", "Selo de destaque (opcional)", { max: 30, placeholder: "Ex.: Regra rígida", dica: "Se preencher, o item fica em vermelho com este selo." }),
        ],
      },
    ],
    padrao: { titulo: "", numerar: true, itens: [{ pergunta: "Primeira pergunta", resposta: "", selo: "" }] },
  },
  cartoes: {
    tipo: "cartoes",
    nome: "Cartões e links",
    descricao: "Cartões clicáveis com ícone, título, texto e botão. Servem para atalhos e links.",
    icone: "grid",
    campos: [
      T("titulo", "Título (opcional)", { max: 120 }),
      S("colunas", "Cartões por linha", [["1", "1 (largo)"], ["2", "2"], ["3", "3"]]),
      S("estilo", "Aparência", [["padrao", "Padrão"], ["destaque", "Destaque azul (grande)"]]),
      {
        k: "lista",
        nome: "itens",
        rotulo: "Cartões",
        rotuloItem: "Cartão",
        max: 24,
        novo: { icone: "grid", etiqueta: "", titulo: "Novo cartão", texto: "", url: "", botao: "Abrir" },
        item: [
          { k: "icone", nome: "icone", rotulo: "Ícone" },
          T("etiqueta", "Etiqueta (opcional)", { max: 30 }),
          T("titulo", "Título", { max: 120 }),
          A("texto", "Texto", { max: 300 }),
          U("url", "Link"),
          T("botao", "Texto do botão", { max: 40 }),
        ],
      },
    ],
    padrao: { titulo: "", colunas: "3", estilo: "padrao", itens: [{ icone: "grid", etiqueta: "", titulo: "Novo cartão", texto: "", url: "", botao: "Abrir" }] },
  },
  botoes: {
    tipo: "botoes",
    nome: "Botões",
    descricao: "Uma linha de botões para links importantes.",
    icone: "bolt",
    campos: [
      S("alinhamento", "Alinhamento", [["esquerda", "À esquerda"], ["centro", "Centralizado"]]),
      {
        k: "lista",
        nome: "itens",
        rotulo: "Botões",
        rotuloItem: "Botão",
        max: 8,
        novo: { texto: "Abrir", url: "", estilo: "principal" },
        item: [T("texto", "Texto", { max: 40 }), U("url", "Link"), S("estilo", "Estilo", [["principal", "Principal (dourado)"], ["secundario", "Secundário"]])],
      },
    ],
    padrao: { alinhamento: "esquerda", itens: [{ texto: "Abrir", url: "", estilo: "principal" }] },
  },
  ferramentas: {
    tipo: "ferramentas",
    nome: "Ferramentas e aulas",
    descricao: "Mostra os módulos e ferramentas cadastrados em Admin → Módulos e ferramentas.",
    icone: "calc",
    campos: [
      T("titulo", "Título (opcional)", { max: 120 }),
      S("mostrar", "O que mostrar", [["tudo", "Destaques e todos os módulos"], ["destaques", "Só os cartões de destaque (Comece aqui)"], ["modulos", "Só os módulos"]]),
      { k: "modulo", nome: "modulo", rotulo: "Qual módulo", dica: "“Todos” mostra todos os módulos." },
      T("ver_todas_texto", "Texto do link “ver todas” (opcional)", { max: 60 }),
      U("ver_todas_url", "Link do “ver todas”", { placeholder: "/painel/ferramentas" }),
    ],
    padrao: { titulo: "", mostrar: "tudo", modulo: "todos", ver_todas_texto: "", ver_todas_url: "" },
  },
  feed: {
    tipo: "feed",
    nome: "Postagens (feed)",
    descricao: "As postagens da equipe, com curtidas e comentários.",
    icone: "news",
    campos: [
      T("titulo", "Título (opcional)", { max: 120 }),
      { k: "num", nome: "limite", rotulo: "Quantas postagens mostrar", min: 1, max: 40 },
      { k: "sim", nome: "so_fixadas", rotulo: "Mostrar só as postagens fixadas" },
      T("ver_todas_texto", "Texto do link “ver todas” (opcional)", { max: 60 }),
      U("ver_todas_url", "Link do “ver todas”", { placeholder: "/painel/novidades" }),
    ],
    padrao: { titulo: "", limite: 10, so_fixadas: false, ver_todas_texto: "", ver_todas_url: "" },
  },
  avisos: {
    tipo: "avisos",
    nome: "Avisos (carrossel)",
    descricao: "Os avisos ativos passando de 5 em 5 segundos. Gerencie em Admin → Avisos ou transformando postagens em aviso.",
    icone: "megaphone",
    campos: [],
    padrao: {},
  },
  corrida: {
    tipo: "corrida",
    nome: "Corrida (contagem e pódio)",
    descricao: "Competição com datas, contagem regressiva e pódio de prêmios.",
    icone: "trophy",
    campos: [
      S("variante", "Tamanho", [["completo", "Completo (datas, contagem e pódio)"], ["resumo", "Resumo (cartão com botão)"]]),
      T("etiqueta", "Texto pequeno", { max: 80 }),
      T("titulo", "Título", { max: 80 }),
      A("texto", "Texto (opcional)", { max: 400 }),
      { k: "data", nome: "inicio", rotulo: "Início" },
      { k: "data", nome: "fim", rotulo: "Encerramento" },
      { k: "data", nome: "prazo", rotulo: "Prazo máximo de envio (opcional)" },
      T("prazo_rotulo", "Nome do prazo", { max: 60 }),
      { k: "sim", nome: "contagem", rotulo: "Mostrar contagem regressiva" },
      {
        k: "lista",
        nome: "premios",
        rotulo: "Pódio (1º, 2º e 3º lugares)",
        rotuloItem: "Prêmio",
        max: 3,
        novo: { posicao: "1º", valor: "R$ 0", legenda: "" },
        item: [T("posicao", "Posição", { max: 10 }), T("valor", "Prêmio", { max: 30 }), T("legenda", "Legenda", { max: 30 })],
      },
      T("link_texto", "Texto do botão (no resumo)", { max: 40 }),
      U("link_url", "Link do botão (no resumo)", { placeholder: "/painel/race" }),
    ],
    padrao: {
      variante: "completo",
      etiqueta: "Competição",
      titulo: "Nova corrida",
      texto: "",
      inicio: "",
      fim: "",
      prazo: "",
      prazo_rotulo: "Prazo máximo de envio",
      contagem: true,
      premios: [
        { posicao: "1º", valor: "R$ 1.000", legenda: "em Pix" },
        { posicao: "2º", valor: "R$ 500", legenda: "em Pix" },
        { posicao: "3º", valor: "R$ 200", legenda: "em Pix" },
      ],
      link_texto: "Ver a corrida",
      link_url: "",
    },
  },
  separador: {
    tipo: "separador",
    nome: "Separador",
    descricao: "Uma linha ou um espaço em branco entre blocos.",
    icone: "tag",
    campos: [S("estilo", "Estilo", [["linha", "Linha"], ["espaco", "Espaço em branco"]])],
    padrao: { estilo: "linha" },
  },
};

export const TIPOS: TipoBloco[] = Object.keys(BLOCOS) as TipoBloco[];
export const ehTipo = (t: unknown): t is TipoBloco => typeof t === "string" && t in BLOCOS;

// ------------------------------------------------------------------ validação

const URL_HTTP = /^https?:\/\/[^\s]+$/i;

export function urlSegura(v: unknown): string {
  const s = typeof v === "string" ? v.trim().slice(0, 700) : "";
  if (URL_HTTP.test(s)) return s;
  if (s.startsWith("/") && !s.startsWith("//") && !/\s/.test(s)) return s;
  return "";
}

function limpaTexto(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "";
}

function limpaCampo(c: Campo, v: unknown, prof: number): unknown {
  switch (c.k) {
    case "texto":
      return limpaTexto(v, c.max ?? 200);
    case "area":
      return limpaTexto(v, c.max ?? 1000);
    case "rico": {
      if (typeof v !== "string" || !v.trim().startsWith("{") || v.length > 120000) return "";
      try {
        const doc = limparDoc(JSON.parse(v));
        if (!doc) return "";
        const s = JSON.stringify(doc);
        return conteudoVazio(s) ? "" : s;
      } catch {
        return "";
      }
    }
    case "imagem": {
      const s = typeof v === "string" ? v.trim() : "";
      return URL_HTTP.test(s) ? s.slice(0, 700) : "";
    }
    case "url":
      return urlSegura(v);
    case "num": {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(c.max, Math.max(c.min, Math.round(n))) : c.min;
    }
    case "sel": {
      const s = typeof v === "string" ? v : "";
      return c.opcoes.some((o) => o.v === s) ? s : c.opcoes[0].v;
    }
    case "sim":
      return v === true || v === "true" || v === "on";
    case "data": {
      if (typeof v !== "string" || !v) return "";
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? "" : d.toISOString();
    }
    case "icone":
      return typeof v === "string" && v in ICONES ? v : "grid";
    case "modulo":
      return typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : "todos";
    case "lista": {
      if (!Array.isArray(v) || prof > 1) return [];
      return v.slice(0, c.max).map((it) => limpaObjeto(c.item, it, prof + 1));
    }
  }
}

function limpaObjeto(campos: Campo[], bruto: unknown, prof: number): Dados {
  const o = bruto && typeof bruto === "object" ? (bruto as Dados) : {};
  const saida: Dados = {};
  for (const c of campos) saida[c.nome] = limpaCampo(c, o[c.nome], prof);
  return saida;
}

/** Valida e limpa os dados de um bloco, descartando qualquer campo fora do esquema. */
export function normalizarDados(tipo: TipoBloco, bruto: unknown): Dados {
  return limpaObjeto(BLOCOS[tipo].campos, bruto, 0);
}

/** Dados de um bloco já salvo, completados com os padrões (blocos antigos sem algum campo novo). */
export function comPadrao(tipo: TipoBloco, dados: unknown): Dados {
  const base = BLOCOS[tipo].padrao;
  const d = dados && typeof dados === "object" ? (dados as Dados) : {};
  return { ...base, ...d };
}

export const ICONES_PAGINA = [
  "home", "megaphone", "grid", "bolt", "trophy", "book", "layers", "calc", "gauge", "chart", "bag", "hanger", "user", "tag", "news", "bell", "shield",
] as const;
