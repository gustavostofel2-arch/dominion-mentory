import Link from "next/link";
import { NomeTopo, Saudacao } from "../_components/Nome";
import { sair } from "../login/actions";
import RaceCompleta from "../_components/RaceCompleta";
import { FLOW_URL, GRUPOS, ICONES, REGRAS, TOTAL_FERRAMENTAS } from "@/lib/conteudo";

export const metadata = { title: "Painel | Dominion Mentory", robots: { index: false } };

function Icone({ nome }: { nome: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONES[nome] ?? "" }}
    />
  );
}

export default function Painel() {
  return (
    <>
      <header className="nav">
        <div className="wrap">
          <Link href="/painel" aria-label="Painel Dominion Mentory">
            <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
          </Link>
          <nav aria-label="Seções">
            <a href="#ferramentas">Ferramentas</a>
            <a href="#flow" className="hide-m">Dominion Flow</a>
            <a href="#regras">Regras</a>
            <a href="#race" className="hide-m">Race</a>
            <NomeTopo />
          </nav>
          <form action={sair}>
            <button className="btn sm" type="submit">Sair</button>
          </form>
        </div>
      </header>

      <main>
        <div className="wrap dash-hero">
          <span className="eyebrow">Painel do mentorado</span>
          <Saudacao />
          <p>
            {TOTAL_FERRAMENTAS} ferramentas e aulas à sua disposição. Escolha o que usar agora, abra e execute.
          </p>
        </div>

        <section id="ferramentas">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Ferramentas</span>
              <h2>Escolha o sistema e abra</h2>
              <p>
                Cada ferramenta abre em uma página própria. Dentro dela, o botão <b>Painel Dominion</b> traz você de volta aqui.
              </p>
            </div>

            <Link className="start" href="/ferramentas/mapa-de-estudos">
              <div style={{ position: "relative", zIndex: 1 }}>
                <span className="chip aula">Comece aqui</span>
                <h3>Mapa de Estudos</h3>
                <p>Por onde eu começo? Todo mundo parte do mesmo ponto e a rota muda conforme o seu nível.</p>
              </div>
              <span className="btn primary go">Abrir o mapa</span>
            </Link>

            <div style={{ marginTop: 34 }}>
              {GRUPOS.map((g) => (
                <div className="group" key={g.titulo}>
                  <h3>{g.titulo}</h3>
                  <div className="grid">
                    {g.itens.map((it) => (
                      <a className="tool" href={`/ferramentas/${it.slug}`} key={it.slug}>
                        <span className="ic"><Icone nome={it.icone} /></span>
                        <h4>{it.nome}</h4>
                        <p>{it.texto}</p>
                        <div className="row">
                          <span className={`chip ${g.classe}`}>{it.tag}</span>
                          <span className="open">abrir →</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
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
                  Workflows que funcionam dentro do Google Flow para acelerar a sua produção. Os fluxos prontos ficam
                  dentro do próprio Dominion Flow. Entre com o seu login.
                </p>
                <small>Não é venda. Quem já é mentorado já tem acesso.</small>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
                <a className="btn primary" href={FLOW_URL} target="_blank" rel="noopener">
                  Acessar o Dominion Flow
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="regras">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Comunidade</span>
              <h2>Regras da Mentoria Dominion Shop</h2>
              <p>
                Para mantermos um ambiente saudável, produtivo e focado em resultados. Elas existem para proteger o seu
                aprendizado e o de todos os membros.
              </p>
            </div>
            <div className="rules">
              {REGRAS.map((r, i) => (
                <details className={`rule${r.rigida ? " hard" : ""}`} key={r.titulo}>
                  <summary>
                    <span className="n">{i + 1}</span>
                    <span className="tt">{r.titulo}</span>
                    {r.rigida && <span className="tag">Regra rígida</span>}
                    <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="body" dangerouslySetInnerHTML={{ __html: r.html }} />
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="race">
          <div className="wrap">
            <RaceCompleta />
          </div>
        </section>
      </main>

      <footer>
        <img src="/img/logo.png" alt="Dominion Mentory" />
        <p className="tagline">DOMINION — Aprenda, execute e evolua.</p>
      </footer>
    </>
  );
}
