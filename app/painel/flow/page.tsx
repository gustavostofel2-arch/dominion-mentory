import Cabecalho from "../../_components/Cabecalho";
import Rodape from "../../_components/Rodape";
import { FLOW_URL, TURBO_FLOW_URL } from "@/lib/conteudo";

export const metadata = { title: "Dominion Flow | Dominion Mentory", robots: { index: false } };

const SETA = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export default function Flow() {
  return (
    <>
      <main>
        <Cabecalho
          etiqueta="Acesso dos mentorados"
          titulo="Dominion Flow"
          texto="Workflows que funcionam dentro do Google Flow para acelerar a sua produção. Quem já é mentorado já tem acesso."
        />
        <div className="wrap" style={{ display: "grid", gap: 16 }}>
          <div className="flow">
            <div style={{ position: "relative", zIndex: 1 }}>
              <span className="tag">Plataforma</span>
              <h2>Acessar o Dominion Flow</h2>
              <p>
                Os fluxos prontos ficam dentro do próprio Dominion Flow. Entre com o seu login e escolha o workflow que
                quer usar. Não é venda.
              </p>
            </div>
            <a className="btn primary" href={FLOW_URL} target="_blank" rel="noopener" style={{ position: "relative", zIndex: 1 }}>
              Abrir o Dominion Flow {SETA}
            </a>
          </div>

          <div className="flow">
            <div style={{ position: "relative", zIndex: 1 }}>
              <span className="tag">Guia</span>
              <h2>Modo de uso do Flow Turbo</h2>
              <p>Passo a passo de como usar o Flow Turbo do começo ao fim, para você produzir mais rápido.</p>
            </div>
            <a className="btn primary" href={TURBO_FLOW_URL} target="_blank" rel="noopener" style={{ position: "relative", zIndex: 1 }}>
              Ver o modo de uso {SETA}
            </a>
          </div>
        </div>
      </main>
      <Rodape />
    </>
  );
}
