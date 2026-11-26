import Cabecalho from "../../_components/Cabecalho";
import Rodape from "../../_components/Rodape";
import { REGRAS, REGRAS_PLATAFORMA, type Regra } from "@/lib/conteudo";

export const metadata = { title: "Regras | Dominion Mentory", robots: { index: false } };

function Lista({ regras }: { regras: Regra[] }) {
  return (
    <div className="rules">
      {regras.map((r, i) => (
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
  );
}

export default function Regras() {
  return (
    <>
      <main>
        <Cabecalho
          etiqueta="Comunidade"
          titulo="Regras da mentoria e da comunidade"
          texto="Para mantermos um ambiente saudável, produtivo e focado em resultados. Elas existem para proteger o seu aprendizado e o de todos os membros."
        />
        <div className="wrap">
          <div className="sec-titulo"><h2>Mentoria Dominion Shop</h2></div>
          <Lista regras={REGRAS} />

          <div className="sec-titulo" style={{ marginTop: 40 }}><h2>Aqui na plataforma</h2></div>
          <Lista regras={REGRAS_PLATAFORMA} />
        </div>
      </main>
      <Rodape />
    </>
  );
}
