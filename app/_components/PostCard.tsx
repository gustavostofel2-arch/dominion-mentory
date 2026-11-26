import Link from "next/link";
import { renderTexto } from "@/lib/texto";
import { formatarData, PROPORCAO, type Post } from "@/lib/feed";
import CurtirBotao from "./CurtirBotao";

export default function PostCard({ post, completo = false }: { post: Post; completo?: boolean }) {
  const href = `/painel/novidades/${post.id}`;
  const inicial = (post.autorNome ?? "Dominion").trim().charAt(0).toUpperCase();
  return (
    <article className={`post${post.fixado ? " fix" : ""}`}>
      <header className="ph">
        <span className="av" aria-hidden="true">{inicial}</span>
        <div>
          <b>{post.autorNome ?? "Dominion Mentory"}</b>
          <small>{formatarData(post.criadoEm)}</small>
        </div>
        {post.fixado && <span className="pin">Fixado</span>}
      </header>

      {completo ? <h1>{post.titulo}</h1> : <h2><Link href={href}>{post.titulo}</Link></h2>}

      {post.imagemUrl && (
        <img
          className={`pimg ${post.formato ?? "quadrada"}`}
          style={{ aspectRatio: PROPORCAO[post.formato ?? "quadrada"] }}
          src={post.imagemUrl}
          alt=""
          loading="lazy"
        />
      )}

      {post.corpo && <div className={`ptexto${completo ? "" : " clamp"}`}>{renderTexto(post.corpo)}</div>}

      <div className="pf">
        <CurtirBotao postId={post.id} curtidas={post.curtidas} euCurti={post.euCurti} />
        <Link className="cmt" href={`${href}#comentarios`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-5.6A8 8 0 1 1 21 12z" />
          </svg>
          <span>{post.comentarios} {post.comentarios === 1 ? "comentário" : "comentários"}</span>
        </Link>
        {!completo && post.corpo.length > 280 && <Link className="mais" href={href}>Ler tudo →</Link>}
      </div>
    </article>
  );
}
