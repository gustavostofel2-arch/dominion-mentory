import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../_components/PostCard";
import ComentarioForm from "../../../_components/ComentarioForm";
import Rodape from "../../../_components/Rodape";
import { sessaoLogada, eAdminAgora } from "@/lib/admin";
import { formatarData, lerComentarios, lerPost } from "@/lib/feed";
import { apagarComentario } from "../actions";

export const metadata = { title: "Novidades | Dominion Mentory", robots: { index: false } };

export default async function PaginaPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoLogada();
  const email = s?.email ?? null;
  const admin = email ? await eAdminAgora(email) : false;
  const post = await lerPost(id, email, admin);
  if (!post) notFound();
  const comentarios = await lerComentarios(post.id);

  return (
    <>
      <main>
        <div className="wrap" style={{ paddingTop: 28 }}>
          <Link className="voltar-l" href="/painel/novidades">← Voltar para Novidades</Link>
          {!post.publicado && <div className="nota">Rascunho: só admins estão vendo esta postagem.</div>}
          <PostCard post={post} completo />

          <section id="comentarios" className="coments" style={{ padding: 0 }}>
            <h2>{comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}</h2>
            <ComentarioForm postId={post.id} />
            <ul>
              {comentarios.map((c) => (
                <li key={c.id}>
                  <span className="av" aria-hidden="true">{(c.nome ?? "?").trim().charAt(0).toUpperCase()}</span>
                  <div className="cb">
                    <div className="cm">
                      <b>{c.nome ?? "Mentorado"}</b>
                      <small>{formatarData(c.criadoEm)}</small>
                    </div>
                    <p>{c.texto}</p>
                  </div>
                  {(c.email === email || admin) && (
                    <form action={apagarComentario}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="post_id" value={post.id} />
                      <button className="x" type="submit" aria-label="Apagar comentário" title="Apagar">×</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Rodape />
    </>
  );
}
