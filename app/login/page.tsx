import Link from "next/link";
import { redirect } from "next/navigation";
import { getMentorado, caminhoSeguro } from "@/lib/acesso";
import LoginForm from "./LoginForm";

export const metadata = { title: "Acessar sistema | Dominion Mentory", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const destino = caminhoSeguro(next);

  if (await getMentorado()) redirect(destino);

  return (
    <main className="loginwrap">
      <div className="logincard">
        <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
        <div>
          <h1>Acessar sistema</h1>
          <p style={{ marginTop: 8 }}>
            Área exclusiva para mentorados. Digite o e-mail que você usou na compra para entrar.
          </p>
        </div>
        <LoginForm next={destino} />
        <Link className="voltar" href="/">
          &larr; Voltar para o início
        </Link>
      </div>
    </main>
  );
}
