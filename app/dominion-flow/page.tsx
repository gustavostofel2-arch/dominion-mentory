import Link from "next/link";
import { exigirMentorado } from "@/lib/acesso";
import { FLOW_URL } from "@/lib/conteudo";
import "./flow.css";

export const metadata = { title: "Workflows do Dominion Flow | Dominion Mentory", robots: { index: false } };
export const dynamic = "force-dynamic";

type Wf = {
  arquivo: string;
  chip: string;
  titulo: string;
  texto: string;
  contagem: string;
  tamanho: string;
  guia: string;
};
type Grupo = { titulo: string; sub: string; itens: Wf[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "POV Perfume Árabe",
    sub: "Imagem vertical 9:16 no primeiro passo e depois o vídeo animado a partir dela. Duas versões, conforme os cenários que você quer usar.",
    itens: [
      {
        arquivo: "pov-perfume-arabe-cenarios-diferentes.json",
        chip: "Cenários diferentes",
        titulo: "Perfume Árabe · cenários diferentes",
        texto: "Cada imagem usa um cenário diferente e cada uma vira vídeo. Para testar vários ambientes com o mesmo produto.",
        contagem: "5 imagens · 10 vídeos",
        tamanho: "123 KB",
        guia: "pov-perfume-arabe",
      },
      {
        arquivo: "pov-perfume-arabe-cenarios-iguais.json",
        chip: "Cenários iguais",
        titulo: "Perfume Árabe · cenários iguais",
        texto: "Usa o mesmo cenário em todas as variações, para comparar os vídeos em condições iguais.",
        contagem: "1 imagem · 10 vídeos",
        tamanho: "2,9 MB",
        guia: "pov-perfume-arabe",
      },
    ],
  },
  {
    titulo: "POV Show Case · Cabide",
    sub: "Foto base do cabide com o produto trocado e vários vídeos de movimento a partir dela.",
    itens: [
      {
        arquivo: "pov-showcase-cabide.json",
        chip: "Show case",
        titulo: "POV Show Case · Cabide",
        texto: "Gera a imagem base e os vídeos de movimento do show case, com notas dentro do fluxo para guiar cada etapa.",
        contagem: "6 imagens · 17 vídeos",
        tamanho: "267 KB",
        guia: "pov-showcase-cabide",
      },
    ],
  },
  {
    titulo: "UGC Try-On",
    sub: "Imagens que parecem registros pessoais, geradas a partir de referências, e depois os vídeos.",
    itens: [
      {
        arquivo: "ugc-try-on.json",
        chip: "UGC",
        titulo: "UGC Try-On · Cenários Brasileiros",
        texto: "Parte de 6 imagens de referência, gera 5 imagens e anima 4 vídeos. As imagens de referência já vêm dentro do arquivo.",
        contagem: "5 imagens · 4 vídeos",
        tamanho: "1,2 MB",
        guia: "ugc-try-on",
      },
    ],
  },
];

const BAIXAR = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />
  </svg>
);

export default async function Workflows() {
  await exigirMentorado("/dominion-flow");
  return (
    <div className="flowpage">
      <div className="bar">
        <div className="wrap">
          <Link className="back" href="/painel">&larr; Painel Dominion</Link>
          <a className="btn primary" style={{ padding: "9px 14px", fontSize: ".82rem" }} href={FLOW_URL} target="_blank" rel="noopener">
            Acessar o Dominion Flow
          </a>
        </div>
      </div>

      <main className="wrap">
        <div className="hero">
          <img className="logo" src="/img/logo.png" alt="Dominion Mentory" />
          <span className="eyebrow">Dominion Flow</span>
          <h1>Workflows prontos para importar</h1>
          <p>
            Fluxos que rodam dentro do Google Flow para acelerar a sua produção. Baixe o arquivo, importe no Dominion Flow
            e rode. Os resultados de exemplo foram retirados para o arquivo ficar leve: ao rodar, as imagens e os vídeos
            são gerados de novo.
          </p>
        </div>

        <div className="how">
          <div><b>01 · BAIXE</b><span>Escolha o workflow abaixo e baixe o arquivo <code>.json</code>.</span></div>
          <div><b>02 · IMPORTE</b><span>Abra o Dominion Flow e importe o arquivo no seu projeto.</span></div>
          <div><b>03 · RODE</b><span>Confira as imagens de entrada, troque pelo seu produto quando for o caso e gere.</span></div>
        </div>

        {GRUPOS.map((g) => (
          <section className="group" key={g.titulo}>
            <h2>{g.titulo}</h2>
            <p className="sub">{g.sub}</p>
            <div className={`cards${g.itens.length === 1 ? " one" : ""}`}>
              {g.itens.map((w) => (
                <article className="wf" key={w.arquivo}>
                  <div className="chips"><span className="chip a">{w.chip}</span><span className="chip">9:16</span></div>
                  <h3>{w.titulo}</h3>
                  <p>{w.texto}</p>
                  <div className="chips">
                    <span className="chip m">{w.contagem}</span>
                    <span className="chip">Nano Banana Pro</span>
                    <span className="chip">Omni 1.1 Flash</span>
                    <span className="chip">{w.tamanho}</span>
                  </div>
                  <div className="acts">
                    <a className="btn primary" href={`/workflows/${w.arquivo}`} download>
                      {BAIXAR}Baixar .json
                    </a>
                    <a className="lnk" href={`/ferramentas/${w.guia}`}>ver os prompts →</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        <p className="note">Quem é mentorado já tem acesso ao Dominion Flow. Dúvidas sobre o acesso, fale no grupo da mentoria.</p>
      </main>

      <footer>DOMINION — <span>Aprenda, execute e evolua.</span></footer>
    </div>
  );
}
