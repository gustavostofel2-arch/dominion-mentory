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
  | "secoes"
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
    descricao: "Um título grande que chama a pessoa pelo nome. Escreva {nome} onde o primeiro nome dela deve aparecer.",
    icone: "home",
    campos: [
      T("etiqueta", "Texto pequeno acima (opcional)", { max: 80 }),
      T("titulo", "Título", { max: 120, placeholder: "Olá, {nome}", dica: "Use {nome} (ou [nome]) para mostrar o primeiro nome de quem está vendo. Ex.: Olá, {nome}. Bem-vindo!" }),
      A("texto", "Frase abaixo (opcional)", { max: 800 }),
    ],
    padrao: { etiqueta: "", titulo: "Olá, {nome}", texto: "" },
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
      S("largura", "Largura", [["cheia", "Faixa larga (banner)"], ["media", "Média, centralizada (mostra a imagem inteira)"]]),
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
      S("estilo", "Tamanho dos cartões", [["padrao", "Compacto"], ["destaque", "Grande (com botão)"]]),
      {
        k: "lista",
        nome: "itens",
        rotulo: "Cartões",
        rotuloItem: "Cartão",
        max: 24,
        novo: { icone: "grid", etiqueta: "", titulo: "Novo cartão", texto: "", url: "", botao: "Abrir", cor: "" },
        item: [
          { k: "icone", nome: "icone", rotulo: "Ícone" },
          S("cor", "Cor do cartão", [["", "Neutra"], ["azul", "Azul"], ["laranja", "Laranja"], ["verde", "Verde"], ["roxo", "Roxo"], ["vermelho", "Vermelho"]]),
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
  secoes: {
    tipo: "secoes",
    nome: "Seções de cartões",
    descricao: "Cartões agrupados por seção (ex.: “Método e aulas”, “Ferramentas”). Você cria as seções e cada cartão aqui mesmo, um por um.",
    icone: "layers",
    campos: [
      T("titulo", "Título do bloco (opcional)", { max: 120 }),
      S("colunas", "Cartões por linha", [["2", "2"], ["3", "3"], ["4", "4"]]),
      {
        k: "lista",
        nome: "secoes",
        rotulo: "Seções",
        rotuloItem: "Seção",
        max: 12,
        novo: { titulo: "Nova seção", itens: [{ icone: "grid", cor: "", etiqueta: "", titulo: "Novo cartão", texto: "", url: "", botao: "abrir" }] },
        item: [
          T("titulo", "Nome da seção", { max: 80, placeholder: "Ex.: Método e aulas" }),
          {
            k: "lista",
            nome: "itens",
            rotulo: "Cartões da seção",
            rotuloItem: "Cartão",
            max: 24,
            novo: { icone: "grid", cor: "", etiqueta: "", titulo: "Novo cartão", texto: "", url: "", botao: "abrir" },
            item: [
              { k: "icone", nome: "icone", rotulo: "Ícone" },
              S("cor", "Cor do cartão", [["", "Neutra"], ["azul", "Azul"], ["laranja", "Laranja"], ["verde", "Verde"], ["roxo", "Roxo"], ["vermelho", "Vermelho"]]),
              T("etiqueta", "Etiqueta (opcional)", { max: 30, placeholder: "Ex.: Aula, Guia, Calculadora" }),
              T("titulo", "Título", { max: 120 }),
              A("texto", "Descrição", { max: 300 }),
              U("url", "Link (abre em outra aba)"),
              T("botao", "Texto do botão", { max: 20, placeholder: "abrir" }),
            ],
          },
        ],
      },
    ],
    padrao: {
      titulo: "",
      colunas: "3",
      secoes: [{ titulo: "Nova seção", itens: [{ icone: "grid", cor: "", etiqueta: "", titulo: "Novo cartão", texto: "", url: "", botao: "abrir" }] }],
    },
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
    descricao: "Mostra AUTOMATICAMENTE os módulos cadastrados em Admin → Módulos e ferramentas (você não edita cartão por cartão aqui). Para criar e editar cada cartão direto na página, use “Seções de cartões”.",
    icone: "calc",
    campos: [
      T("titulo", "Título (opcional)", { max: 120 }),
      S("mostrar", "O que mostrar", [["tudo", "Destaques e todos os módulos"], ["destaques", "Só os cartões de destaque (Comece aqui)"], ["modulos", "Só os módulos"]]),
      { k: "modulo", nome: "modulo", rotulo: "Qual módulo", dica: "“Todos” mostra todos os módulos." },
    ],
    padrao: { titulo: "", mostrar: "tudo", modulo: "todos" },
  },
  feed: {
    tipo: "feed",
    nome: "Postagens (feed)",
    descricao: "As postagens com curtidas e comentários, como no Instagram. Só a equipe posta; os alunos curtem e comentam.",
    icone: "news",
    campos: [
      T("titulo", "Título (opcional)", { max: 120 }),
      S(
        "modo",
        "Quais postagens aparecem aqui",
        [
          ["pagina", "As desta página (você posta aqui mesmo)"],
          ["destacadas", "Só as que eu destacar (de qualquer lugar)"],
          ["todas", "Todas as postagens da comunidade"],
        ],
        "Para um Início limpo, escolha “só as destacadas”. Para uma página só sua, “as desta página”.",
      ),
    ],
    padrao: { titulo: "", modo: "pagina" },
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
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || s.length > 700 || /[\s\u0000]/.test(s)) return "";
  if (URL_HTTP.test(s)) return s;
  // caminho do próprio painel (sem "//" nem "..")
  if (s.startsWith("/") && !s.startsWith("//") && !s.split("/").includes("..")) return s;
  // qualquer outro esquema (javascript:, data:, mailto:, localhost:3000...) é descartado
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return "";
  // "google.com/abc" digitado sem https://: completa sozinho
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]\S*)?$/i.test(s)) return "https://" + s;
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
  const d = limpaObjeto(BLOCOS[tipo].campos, bruto, 0);
  // itens sem o campo principal viravam linhas em branco para o aluno: descarta
  const filtrar = (lista: unknown, campo: string) => (Array.isArray(lista) ? (lista as Dados[]).filter((i) => typeof i[campo] === "string" && i[campo]) : []);
  if (tipo === "faq") d.itens = filtrar(d.itens, "pergunta");
  if (tipo === "cartoes") d.itens = filtrar(d.itens, "titulo");
  if (tipo === "botoes") d.itens = filtrar(d.itens, "texto");
  if (tipo === "secoes") {
    // cartão sem título some; seção sem cartões some
    d.secoes = (Array.isArray(d.secoes) ? (d.secoes as Dados[]) : [])
      .map((sec) => ({ ...sec, itens: filtrar(sec.itens, "titulo") }))
      .filter((sec) => (sec.itens as Dados[]).length > 0);
  }
  return d;
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

/**
 * Quais postagens um bloco "Postagens" mostra. Blocos antigos (sem "modo"): "só fixadas" vira "destacadas";
 * o resto mostra as postagens da própria página.
 */
export function modoFeed(dados: unknown): "pagina" | "destacadas" | "todas" {
  const d = (dados && typeof dados === "object" ? dados : {}) as Dados;
  if (d.modo === "pagina" || d.modo === "destacadas" || d.modo === "todas") return d.modo;
  return d.so_fixadas ? "destacadas" : "pagina";
}
