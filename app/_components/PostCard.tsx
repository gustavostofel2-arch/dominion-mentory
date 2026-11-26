import Link from "next/link";
import { renderConteudo, textoPuro } from "@/lib/doc";
import { formatarData, PROPORCAO, type Post } from "@/lib/feed";
import CurtirBotao from "./CurtirBotao";
import PostMenu from "./PostMenu";

export default function PostCard({ post, completo = false, admin = false }: { post: Post; completo?: boolean; admin?: boolean }) {
  const href = `/painel/novidades/${post.id}`;
  const nome = post.autorNome ?? "Dominion Mentory";
  const inicial = nome.trim().charAt(0).toUpperCase();
  return (
    <article className={`post${post.fixado ? " fix" : ""}${!post.publicado ? " rascunho" : ""}`}>
      <header className="ph">
        <span className="av" aria-hidden="true">{inicial}</span>
        <div className="ph-quem">
          <b>{nome}</b>
          {post.autorUsuario && <small className="usr">@{post.autorUsuario}</small>}
          <small>{formatarData(post.criadoEm)}</small>
        </div>
        <div className="ph-lado">
          {admin && (
            <PostMenu
              post={{
                id: post.id,
                titulo: post.titulo,
                corpo: post.corpo,
                imagemUrl: post.imagemUrl,
                formato: post.formato,
                fixado: post.fixado,
                publicado: post.publicado,
                avisoTipo: post.avisoTipo,
              }}
            />
          )}
        </div>
      </header>

      {(post.fixado || post.avisoTipo || !post.publicado) && (
        <div className="selos">
          {post.fixado && <span className="pin">📌 Fixado</span>}
          {post.avisoTipo && <span className="pin aviso">📢 Também é aviso</span>}
          {!post.publicado && <span className="pin rasc">Rascunho</span>}
        </div>
      )}

      {completo ? <h1>{post.titulo}</h1> : <h2><Link href={href}>{post.titulo}</Link></h2>}

      {post.imagemUrl && (
        <img
          className={`pimg ${post.formato ?? "quadrada"}`}
          style={{ aspectRatio: PROPORCAO[post.formato ?? "quadrada"] }}
          src={post.imagemUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
      )}

      {post.corpo && <div className={`ptexto${completo ? "" : " clamp"}`}>{renderConteudo(post.corpo)}</div>}

      <div className="pf">
        <CurtirBotao postId={post.id} curtidas={post.curtidas} euCurti={post.euCurti} />
        <Link className="cmt" href={`${href}#comentarios`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-5.6A8 8 0 1 1 21 12z" />
          </svg>
          <span>{post.comentarios} {post.comentarios === 1 ? "comentário" : "comentários"}</span>
        </Link>
        {!completo && textoPuro(post.corpo).length > 280 && <Link className="mais" href={href}>Ler tudo →</Link>}
      </div>
    </article>
  );
}
