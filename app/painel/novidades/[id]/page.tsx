import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "../../../_components/PostCard";
import ComentarioForm from "../../../_components/ComentarioForm";
import Comentarios from "../../../_components/Comentarios";
import Rodape from "../../../_components/Rodape";
import { sessaoLogada, eAdminAgora } from "@/lib/admin";
import { lerComentarios, lerPost } from "@/lib/feed";

export const metadata = { title: "Novidades | Dominion Mentory", robots: { index: false } };

export default async function PaginaPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await sessaoLogada();
  const email = s?.email ?? null;
  const admin = email ? await eAdminAgora(email) : false;
  const [post, comentarios] = await Promise.all([lerPost(id, email, admin), lerComentarios(id)]);
  if (!post) notFound();

  return (
    <>
      <main>
        <div className="wrap" style={{ paddingTop: 28 }}>
          <Link className="voltar-l" href="/painel/novidades">← Voltar para Novidades</Link>
          {!post.publicado && <div className="nota">Rascunho: só admins estão vendo esta postagem.</div>}
          <PostCard post={post} completo admin={admin} />

          <section id="comentarios" className="coments">
            <h2>{comentarios.length} {comentarios.length === 1 ? "comentário" : "comentários"}</h2>
            <ComentarioForm postId={post.id} />
            <Comentarios comentarios={comentarios} postId={post.id} meuEmail={email} admin={admin} />
          </section>
        </div>
      </main>
      <Rodape />
    </>
  );
}
