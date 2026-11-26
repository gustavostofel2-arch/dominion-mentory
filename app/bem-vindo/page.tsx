import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessaoLogada } from "@/lib/admin";
import { buscarUsuario } from "@/lib/perfil";
import { assinar, COOKIE_OK, OPCOES_COOKIE } from "@/lib/sessao";
import FormUsuario from "./FormUsuario";
import "./bem-vindo.css";

export const metadata = { title: "Boas-vindas | Dominion Mentory", robots: { index: false } };

export default async function BemVindo() {
  const s = await sessaoLogada();
  if (!s) redirect("/login");
  // Se a pessoa já tem @ (cookie antigo), só atualiza o cookie e segue.
  if (!s.usuario) {
    const u = await buscarUsuario(s.email);
    if (u) {
      const jar = await cookies();
      jar.set(COOKIE_OK, await assinar({ email: s.email, nome: s.nome, usuario: u }), OPCOES_COOKIE);
      redirect("/painel");
    }
  }
  const primeiro = (s.nome ?? "").trim().split(/\s+/)[0];

  return (
    <div className="loginwrap">
      <div className="logincard bv-card">
        <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
        <span className="eyebrow">Primeiro acesso</span>
        <h1>{primeiro ? `Bem-vindo, ${primeiro}!` : "Bem-vindo!"}</h1>
        <p>
          Escolha o seu <b>@</b> na comunidade. É ele que aparece nos seus comentários, com o seu nome por cima.
          Cada @ é único e <b>não pode ser trocado depois</b>.
        </p>
        <div className="bv-previa" aria-hidden="true">
          <span className="av">{(primeiro || "D").charAt(0).toUpperCase()}</span>
          <div>
            <b>{s.nome ?? "Seu nome"}</b>
            <small>@seunome</small>
          </div>
        </div>
        <FormUsuario />
      </div>
    </div>
  );
}
