import Link from "next/link";
import Countdown from "./_components/Countdown";
import { FLOW_URL, TIKTOK, WHATSAPP } from "@/lib/conteudo";

export const metadata = {
  title: "Dominion Mentory | Escalando TikTok Shop com multicontas",
};

export default function Inicio() {
  return (
    <>
      <header className="nav">
        <div className="wrap">
          <a href="#topo" aria-label="Dominion Mentory">
            <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
          </a>
          <nav aria-label="Seções">
            <a href="#sistema">Sistema</a>
            <a href="#flow" className="hide-m">Dominion Flow</a>
            <a href="#mentor" className="hide-m">Mentor</a>
            <a href="#race">Race</a>
          </nav>
          <Link className="btn primary" href="/login">Acessar sistema</Link>
        </div>
      </header>

      <main id="topo">
        <div className="hero">
          <div className="wrap">
            <span className="eyebrow">Dominion Mentory</span>
            <h1>
              Escalando a operação de <em>TikTok Shop</em> com multicontas
            </h1>
            <p className="lead">
              Mentoria prática para quem quer vender no TikTok Shop com método, ferramentas e uma comunidade que executa.
            </p>
            <div className="ctas">
              <Link className="btn primary" href="/login">Acessar sistema</Link>
              <a className="btn" href="#race">Ver a Dominion Race</a>
              <a className="btn" href={WHATSAPP} target="_blank" rel="noopener">Quero ser mentorado</a>
            </div>
            <div className="stats">
              <div className="stat"><b>Turma 1</b><span>corrida aberta</span></div>
              <div className="stat"><b>R$ 1.700</b><span>em prêmios no pódio</span></div>
              <div className="stat"><b>Multicontas</b><span>operação testada todo dia</span></div>
              <div className="stat"><b>Comunidade</b><span>grupo exclusivo de alunos</span></div>
            </div>
          </div>
        </div>

        <section id="sistema">
          <div className="wrap">
            <div className="explain">
              <div style={{ position: "relative", zIndex: 1 }}>
                <span className="eyebrow">O sistema</span>
                <h2>Tudo da mentoria em um só lugar</h2>
                <p>
                  Os mentorados têm um sistema próprio com ferramentas de planejamento, guias práticos, aulas e as regras
                  da comunidade. Nada de caçar link: você entra, escolhe e executa.
                </p>
                <p style={{ marginTop: 10 }}>
                  O acesso é exclusivo para mentorados ativos e é liberado pelo e-mail que você usou na compra.
                </p>
                <div className="cta">
                  <Link className="btn primary" href="/login">Acessar sistema</Link>
                </div>
              </div>
              <ul className="pts">
                <li><b>01</b><span>Ferramentas para planejar a operação e as postagens</span></li>
                <li><b>02</b><span>Guias e aulas práticas, direto ao ponto</span></li>
                <li><b>03</b><span>Regras da comunidade e regulamento da Dominion Race</span></li>
                <li><b>04</b><span>Entrada só com o e-mail da compra, sem senha</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section id="flow">
          <div className="wrap">
            <div className="flow">
              <div style={{ position: "relative", zIndex: 1 }}>
                <span className="tag">Acesso dos mentorados</span>
                <h2>Dominion Flow</h2>
                <p>
                  Workflows que funcionam dentro do Google Flow para acelerar a sua produção. Entre com o seu login e use
                  os fluxos prontos.
                </p>
                <small>Não é venda. Quem já é mentorado já tem acesso.</small>
              </div>
              <a className="btn primary" href={FLOW_URL} target="_blank" rel="noopener">
                Acessar o Dominion Flow
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17 17 7M8 7h9v9" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        <section id="mentor">
          <div className="wrap mentor">
            <div className="photo">
              <img src="/img/higor.webp" alt="Higor Machado, mentor da Dominion" width={1024} height={1024} loading="lazy" />
              <span className="badge">Dominion Mentory</span>
            </div>
            <div>
              <span className="eyebrow">Seu mentor</span>
              <h2>Higor Machado</h2>
              <div className="role">Dono e sócio de operações multi-contas no TikTok Shop</div>
              <p className="t">
                Casado, cristão. Não é teoria — é operação rodando, testada e ajustada todo dia, na prática. Não vive de
                vender curso, vive de operar conta, isso muda tudo.
              </p>
              <p className="t">
                O método já funcionou pra dezenas de pessoas, muitas delas travadas no TikTok e no digital, tentando
                sozinhas sem sair do lugar.
              </p>
              <div className="ctas">
                <a className="btn primary" href={WHATSAPP} target="_blank" rel="noopener">Quero ser mentorado</a>
                <a className="btn" href={TIKTOK} target="_blank" rel="noopener">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
                    <path d="M14 3c.4 2.6 2 4.2 5 4.5" />
                  </svg>
                  TikTok @higor.prompt
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="race">
          <div className="wrap">
            <div className="race">
              <div className="top">
                <svg className="crown" viewBox="0 0 64 64" aria-hidden="true">
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#ffe29a" />
                      <stop offset=".5" stopColor="#ffb020" />
                      <stop offset="1" stopColor="#ff7a1a" />
                    </linearGradient>
                  </defs>
                  <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill="url(#cg)" />
                  <rect x="8" y="49" width="48" height="7" rx="2" fill="url(#cg)" />
                  <circle cx="3" cy="18" r="3" fill="#ffe29a" />
                  <circle cx="32" cy="10" r="3.4" fill="#ffe29a" />
                  <circle cx="61" cy="18" r="3" fill="#ffe29a" />
                </svg>
                <span className="eyebrow">Regulamento oficial · Turma 1</span>
                <h2>DOMINION RACE</h2>
                <p>
                  A corrida da Turma 1 está oficialmente aberta! São 2 premiações acontecendo ao mesmo tempo: o pódio de
                  faturamento e o Dominion MVP.
                </p>
              </div>

              <div className="dates">
                <div className="date"><small>Início</small><b>01/11/2026</b></div>
                <div className="date"><small>Encerramento</small><b>30/11/2026</b></div>
              </div>
              <Countdown />

              <div className="podium" role="img" aria-label="Pódio: 1º lugar R$ 1.000, 2º lugar R$ 500, 3º lugar R$ 200">
                <div className="step p2"><span className="medal">2º</span><span className="pix">R$ 500</span><small>em Pix</small></div>
                <div className="step p1">
                  <svg className="mini-crown" viewBox="0 0 64 64" aria-hidden="true">
                    <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill="url(#cg)" />
                    <rect x="8" y="49" width="48" height="7" rx="2" fill="url(#cg)" />
                  </svg>
                  <span className="medal">1º</span><span className="pix">R$ 1.000</span><small>em Pix</small>
                </div>
                <div className="step p3"><span className="medal">3º</span><span className="pix">R$ 200</span><small>em Pix</small></div>
              </div>

              <div className="cols">
                <div className="box">
                  <h3>Parte 1 · Pódio de faturamento</h3>
                  <p>
                    Os alunos competem para faturar o máximo possível no TikTok Shop. Não importa com quantas contas você
                    trabalha: vale somar o GMV de <b>quantas contas você tiver</b>. O faturamento é acumulativo durante todo
                    o período da corrida.
                  </p>
                </div>
                <div className="box">
                  <h3>Parte 2 · Dominion MVP</h3>
                  <p>
                    O prêmio para o aluno mais ativo, constante e colaborativo do grupo. Ganha quem mais ajuda os outros
                    mentorados e agrega valor de verdade.
                  </p>
                  <p>
                    <span className="prize">Prêmio: surpresa + reconhecimento oficial</span>
                  </p>
                </div>
              </div>
              <p className="note" style={{ marginTop: 18, textAlign: "center", marginInline: "auto" }}>
                O resultado será anunciado na live de encerramento e o Pix é pago em até 48 horas após a apuração final.
                O regulamento completo está dentro do sistema, para os mentorados.
              </p>

              <p className="foot">Bora pra cima! Vence quem mais executa.</p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <img src="/img/logo.png" alt="Dominion Mentory" />
        <p className="tagline">DOMINION — Aprenda, execute e evolua.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link className="btn primary" href="/login">Acessar sistema</Link>
          <a className="btn" href={WHATSAPP} target="_blank" rel="noopener">Quero ser mentorado</a>
        </div>
      </footer>
    </>
  );
}
