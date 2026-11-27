import Link from "next/link";

/** Página que não existe (ou que está oculta): mostra uma saída em vez do 404 seco. */
export default function NaoEncontrada() {
  return (
    <main>
      <div className="wrap pg-head">
        <span className="eyebrow">Ops</span>
        <h1>Página não encontrada</h1>
        <p>Essa página não existe ou foi movida. Se você acabou de entrar, pode ter sido só um tropeço: tente de novo.</p>
        <div className="acts" style={{ marginTop: 18 }}>
          <Link className="btn primary" href="/painel">Ir para o Início</Link>
          <a className="btn" href="">Tentar de novo</a>
        </div>
      </div>
    </main>
  );
}
