import { Saudacao } from "../_components/Nome";
import RaceCompleta from "../_components/RaceCompleta";
import Avisos from "../_components/Avisos";
import { Icone } from "../_components/Icone";
import { carregarAvisos, carregarCatalogo } from "@/lib/catalogo";
import { FLOW_URL, REGRAS, TURBO_FLOW_URL } from "@/lib/conteudo";

export const metadata = { title: "Painel | Dominion Mentory", robots: { index: false } };

export default async function Painel() {
  const [modulos, avisos] = await Promise.all([carregarCatalogo(), carregarAvisos()]);

  const destaques = modulos.flatMap((m) => m.itens.filter((i) => i.destaque));
  const grupos = modulos
    .map((m) => ({ ...m, itens: m.itens.filter((i) => !i.destaque) }))
    .filter((m) => m.itens.length > 0);
  const total = modulos.reduce((n, m) => n + m.itens.length, 0);

  return (
    <>
      <main>
        <Avisos avisos={avisos} />

        <div className="wrap dash-hero">
          <span className="eyebrow">Painel do mentorado</span>
          <Saudacao />
          <p>{total} ferramentas e aulas à sua disposição. Escolha o que usar agora, abra e execute.</p>
        </div>

        <section id="ferramentas">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Ferramentas</span>
              <h2>Escolha o sistema e abra</h2>
              <p>Cada ferramenta abre em uma nova aba. Para voltar, é só fechar a aba e você continua aqui no painel.</p>
            </div>

            {destaques.map((d) => (
              <a className="start" href={d.url} target="_blank" rel="noopener noreferrer" key={d.id} style={{ marginBottom: 14 }}>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <span className="chip aula">{d.tag || "Comece aqui"}</span>
                  <h3>{d.titulo}</h3>
                  <p>{d.descricao}</p>
                </div>
                <span className="btn primary go">Abrir</span>
              </a>
            ))}

            <div style={{ marginTop: 34 }}>
              {grupos.map((g) => (
                <div className="group" key={g.id}>
                  <h3>{g.titulo}</h3>
                  <div className="grid">
                    {g.itens.map((it) => (
                      <a className="tool" href={it.url} target="_blank" rel="noopener noreferrer" key={it.id}>
                        <span className="ic"><Icone nome={it.icone} /></span>
                        <h4>{it.titulo}</h4>
                        <p>{it.descricao}</p>
                        <div className="row">
                          {it.tag ? <span className={`chip ${g.cor}`}>{it.tag}</span> : <span />}
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
                <a className="btn" href={TURBO_FLOW_URL} target="_blank" rel="noopener">
                  Modo de uso do Flow Turbo
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="race">
          <div className="wrap">
            <RaceCompleta />
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
      </main>

      <footer>
        <img src="/img/logo.png" alt="Dominion Mentory" />
        <p className="tagline">DOMINION — Aprenda, execute e evolua.</p>
      </footer>
    </>
  );
}
