import LoginForm from "./LoginForm";

export const metadata = { title: "Acessar sistema | Dominion Mentory", robots: { index: false } };

export default function Login() {
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
        <LoginForm />
      </div>
    </main>
  );
}
