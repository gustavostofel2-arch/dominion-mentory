import Link from "next/link";
import { listarPostsAdmin, formatarData, type Post } from "@/lib/feed";
import { criarPost, excluirPost, salvarPost } from "../actions";
import ConfirmButton from "../ConfirmButton";
import EditorTexto from "../../../_components/EditorTexto";
import UploadImagem from "../../../_components/UploadImagem";

function Campos({ p }: { p?: Post }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="fld">
        <label>Título</label>
        <input type="text" name="titulo" required maxLength={160} defaultValue={p?.titulo} placeholder="Ex.: Call de hoje às 20h" />
      </div>
      <div className="fld">
        <label>Texto</label>
        <EditorTexto valor={p?.corpo ?? ""} />
      </div>
      <UploadImagem atual={p?.imagemUrl} formatoAtual={p?.formato} />
      <div className="fgrid">
        <label className="chk">
          <input type="checkbox" name="fixado" defaultChecked={p?.fixado ?? false} /> Fixar em “Em destaque” no Início
        </label>
        <label className="chk">
          <input type="checkbox" name="publicado" defaultChecked={p ? p.publicado : true} /> Publicado (desmarque para guardar como rascunho)
        </label>
      </div>
    </div>
  );
}

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const [{ ok, erro }, posts] = await Promise.all([searchParams, listarPostsAdmin()]);
  return (
    <>
      {ok && <div className="nota">{ok}</div>}
      {erro && <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>{erro}</div>}

      <div className="panel">
        <h2>Nova postagem</h2>
        <form action={criarPost}>
          <Campos />
          <div className="acts">
            <button className="btn primary" type="submit">Publicar</button>
          </div>
        </form>
      </div>

      <h3 style={{ fontSize: ".95rem", margin: "26px 0 4px" }}>Postagens criadas</h3>
      {posts.length === 0 && <p style={{ color: "var(--muted)" }}>Nenhuma postagem ainda.</p>}
      {posts.map((p) => (
        <details className="it" key={p.id}>
          <summary>
            <span>{p.titulo}</span>
            {p.fixado && <span className="badge-off" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>fixado</span>}
            {!p.publicado && <span className="badge-off">rascunho</span>}
            <span className="meta">{formatarData(p.criadoEm)} · ♥ {p.curtidas} · 💬 {p.comentarios}</span>
          </summary>
          <form>
            <input type="hidden" name="id" value={p.id} />
            <Campos p={p} />
            <div className="acts">
              <button className="btn primary mini" type="submit" formAction={salvarPost}>Salvar</button>
              <Link className="btn mini" href={`/painel/novidades/${p.id}`}>Ver no painel</Link>
              <ConfirmButton action={excluirPost} msg="Excluir esta postagem (com curtidas e comentários)?" className="btn danger mini">Excluir</ConfirmButton>
            </div>
          </form>
        </details>
      ))}
    </>
  );
}
