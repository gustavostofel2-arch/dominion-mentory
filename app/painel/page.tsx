import Link from "next/link";
import { Saudacao } from "../_components/Nome";
import Avisos from "../_components/Avisos";
import Countdown from "../_components/Countdown";
import PostCard from "../_components/PostCard";
import Rodape from "../_components/Rodape";
import { carregarAvisos, carregarCatalogo } from "@/lib/catalogo";
import { emailLogado, ehAdminParaMenu } from "@/lib/admin";
import { listarPosts, ultimosPosts } from "@/lib/feed";

export const metadata = { title: "Início | Dominion Mentory", robots: { index: false } };

export default async function Inicio() {
  const email = await emailLogado();
  const [modulos, avisos, fixados, recentes, admin] = await Promise.all([
    carregarCatalogo(),
    carregarAvisos(),
    listarPosts({ email, soFixados: true, limite: 3 }),
    ultimosPosts(email, 4),
    ehAdminParaMenu(email),
  ]);

  const destaques = modulos.flatMap((m) => m.itens.filter((i) => i.destaque));
  const total = modulos.reduce((n, m) => n + m.itens.length, 0);
  const idsFixados = new Set(fixados.map((p) => p.id));
  const novidades = recentes.filter((p) => !idsFixados.has(p.id)).slice(0, 3);

  return (
    <>
      <main>
        <Avisos avisos={avisos} />

        <div className="wrap pg-head">
          <span className="eyebrow">Painel do mentorado</span>
          <Saudacao />
          <p>Tudo da mentoria em um lugar só: avisos, novidades, ferramentas e a corrida. Comece pelo que está em destaque.</p>
        </div>

        <section className="bloco">
          <div className="wrap">
            <Link className="race-mini" href="/painel/race">
              <svg className="crown" viewBox="0 0 64 64" aria-hidden="true">
                <defs>
                  <linearGradient id="cg2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#ffe29a" />
                    <stop offset=".5" stopColor="#ffb020" />
                    <stop offset="1" stopColor="#ff7a1a" />
                  </linearGradient>
                </defs>
                <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill="url(#cg2)" />
                <rect x="8" y="49" width="48" height="7" rx="2" fill="url(#cg2)" />
              </svg>
              <div>
                <span className="eyebrow">Turma 1 · 01/11 a 30/11</span>
                <h2>Dominion Race</h2>
                <Countdown completo />
              </div>
              <span className="btn primary">Ver a corrida</span>
            </Link>
          </div>
        </section>

        {fixados.length > 0 && (
          <section className="bloco">
            <div className="wrap">
              <div className="sec-titulo"><h2>Em destaque</h2></div>
              <div className="feed">
                {fixados.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            </div>
          </section>
        )}

        <section className="bloco">
          <div className="wrap">
            <div className="sec-titulo">
              <h2>Últimas novidades</h2>
              <Link href="/painel/novidades">Ver todas →</Link>
            </div>
            {novidades.length === 0 && fixados.length === 0 ? (
              <div className="vazio-card">
                <b>Ainda não há novidades.</b>
                <p>Quando a equipe publicar, vai aparecer aqui. Enquanto isso, comece pelo Mapa de Estudos.</p>
                {admin && <Link className="btn primary sm" href="/painel/admin/posts">Criar a primeira postagem</Link>}
              </div>
            ) : (
              <div className="feed">
                {novidades.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            )}
          </div>
        </section>

        <section className="bloco">
          <div className="wrap">
            <div className="sec-titulo">
              <h2>Comece por aqui</h2>
              <Link href="/painel/ferramentas">Ver as {total} ferramentas →</Link>
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
            <div className="atalhos">
              <Link className="atalho" href="/painel/ferramentas"><b>Ferramentas e aulas</b><span>Calculadoras, guias e prompts</span></Link>
              <Link className="atalho" href="/painel/flow"><b>Dominion Flow</b><span>Workflows do Google Flow</span></Link>
              <Link className="atalho" href="/painel/regras"><b>Regras</b><span>Mentoria e comunidade</span></Link>
            </div>
          </div>
        </section>
      </main>
      <Rodape />
    </>
  );
}
