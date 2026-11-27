import Link from "next/link";

export const metadata = { title: "Página não encontrada | Dominion Mentory", robots: { index: false } };

export default function NaoEncontrada() {
  return (
    <div className="loginwrap">
      <div className="logincard" style={{ textAlign: "center", alignItems: "center" }}>
        <img className="lg" src="/img/logo.png" alt="Dominion Mentory" style={{ alignSelf: "center" }} />
        <span className="eyebrow">Erro 404</span>
        <h1>Página não encontrada</h1>
        <p>Esse endereço não existe ou foi movido. Se você acabou de entrar, tente de novo.</p>
        <Link className="btn primary" href="/painel">Ir para o painel</Link>
        <a className="btn" href="">Tentar de novo</a>
      </div>
    </div>
  );
}
