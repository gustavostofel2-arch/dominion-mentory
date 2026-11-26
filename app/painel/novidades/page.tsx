import Link from "next/link";
import Avisos from "../../_components/Avisos";
import Cabecalho from "../../_components/Cabecalho";
import PostCard from "../../_components/PostCard";
import Rodape from "../../_components/Rodape";
import { carregarAvisos } from "@/lib/catalogo";
import { emailLogado, ehAdminParaMenu } from "@/lib/admin";
import { listarPosts } from "@/lib/feed";

export const metadata = { title: "Novidades | Dominion Mentory", robots: { index: false } };

export default async function Novidades() {
  const email = await emailLogado();
  const [avisos, posts, admin] = await Promise.all([carregarAvisos(), listarPosts({ email, limite: 40 }), ehAdminParaMenu(email)]);

  return (
    <>
      <main>
        <Avisos avisos={avisos} />
        <Cabecalho etiqueta="Comunidade" titulo="Novidades" texto="Avisos e postagens da equipe. Curta e comente para tirar dúvidas e trocar ideia com a turma." />
        <div className="wrap">
          {admin && (
            <div style={{ marginBottom: 18 }}>
              <Link className="btn primary sm" href="/painel/admin/posts">+ Nova postagem</Link>
            </div>
          )}
          {posts.length === 0 ? (
            <div className="vazio-card">
              <b>Ainda não há postagens.</b>
              <p>Assim que a equipe publicar uma novidade, ela aparece aqui.</p>
            </div>
          ) : (
            <div className="feed">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
      </main>
      <Rodape />
    </>
  );
}
