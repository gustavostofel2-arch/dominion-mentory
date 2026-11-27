import Link from "next/link";
import { listarPostsAdmin, formatarData } from "@/lib/feed";
import { criarPost, excluirPost, salvarPost } from "../actions";
import ConfirmButton from "../ConfirmButton";
import CamposPost, { type OpcaoDestino } from "../../../_components/CamposPost";
import { carregarPainel, rotuloMenu } from "@/lib/paginas";
import { modoFeed } from "@/lib/blocos";

/** Páginas que têm um bloco de Postagens que mostra as postagens da própria página (é onde dá para publicar). */
async function destinosDePostagem(): Promise<OpcaoDestino[]> {
  const { paginas } = await carregarPainel();
  return paginas
    .filter((p) => p.blocos.some((b) => b.tipo === "feed" && modoFeed(b.dados) === "pagina"))
    .map((p) => ({ slug: p.slug, rotulo: rotuloMenu(p) }));
}
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paraCampoData } from "@/lib/agenda";

/** Postagens com publicação agendada (id → data no formato do campo). */
async function agendadas(): Promise<Map<string, string>> {
  const m = new Map<string, string>();
  try {
    const { data } = await supabaseAdmin().from("agenda").select("post_id,enviar_em").eq("tipo", "postagem").eq("status", "pendente");
    for (const l of (data ?? []) as { post_id: string; enviar_em: string }[]) if (l.post_id) m.set(l.post_id, paraCampoData(l.enviar_em));
  } catch {
    // sem a etapa 6 ainda
  }
  return m;
}

const RETORNO = "/painel/admin/posts";

export default async function AdminPosts() {
  // as mensagens (?ok= / ?erro=) são lidas no navegador pelo MensagemAdmin; a página não depende da URL
  const searchParams = Promise.resolve({} as { ok?: string; erro?: string });
  const [{ ok, erro }, posts, agenda, destinos] = await Promise.all([searchParams, listarPostsAdmin(), agendadas(), destinosDePostagem()]);
  const rotuloDe = (slug: string | null) => destinos.find((d) => d.slug === (slug ?? "novidades"))?.rotulo ?? (slug ? slug : "Novidades");
  return (
    <>
      {ok && <div className="nota">{ok}</div>}
      {erro && <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>{erro}</div>}

      <div className="explica">
        <div><b>Postagem</b><span>Novidade, aula nova, conteúdo tranquilo. Fica em <b>Novidades</b> e os alunos curtem e comentam.</span></div>
        <div><b>Aviso</b><span>Algo urgente ou importante (ex.: call hoje). Fica no <b>carrossel do Início</b>. Qualquer postagem pode virar aviso.</span></div>
      </div>

      <div className="panel" id="novo">
        <h2>Nova postagem</h2>
        {destinos.length === 0 ? (
          <p className="dica">
            Nenhuma página tem um bloco de <b>Postagens</b> ainda. Abra uma página, clique em “Editar página” → “Adicionar bloco” → “Postagens (feed)” e escolha
            “as desta página”. Depois você posta direto nela, ou por aqui.
          </p>
        ) : (
          <form action={criarPost}>
            <CamposPost retorno={RETORNO} opcoes={destinos} />
            <div className="acts">
              <button className="btn primary" type="submit">Publicar</button>
            </div>
          </form>
        )}
      </div>

      <h3 style={{ fontSize: ".95rem", margin: "26px 0 4px" }}>Postagens criadas</h3>
      {posts.length === 0 && <p style={{ color: "var(--muted)" }}>Nenhuma postagem ainda.</p>}
      {posts.map((p) => (
        <details className="it" key={p.id} id={`p-${p.id}`}>
          <summary>
            <span>{p.titulo}</span>
            {p.fixado && <span className="badge-off" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>fixada</span>}
            {p.avisoTipo && <span className="badge-off" style={{ background: "var(--wait-soft)", color: "var(--wait)" }}>aviso</span>}
            {agenda.has(p.id) ? <span className="badge-off" style={{ background: "var(--wait-soft)", color: "var(--wait)" }}>agendada</span> : !p.publicado && <span className="badge-off">rascunho</span>}
            <span className="meta">{rotuloDe(p.paginaSlug)} · {formatarData(p.criadoEm)} · ♥ {p.curtidas} · 💬 {p.comentarios}</span>
          </summary>
          <form>
            <CamposPost
              retorno={RETORNO}
              opcoes={destinos.some((d) => d.slug === (p.paginaSlug ?? "novidades")) ? destinos : [...destinos, { slug: p.paginaSlug ?? "novidades", rotulo: rotuloDe(p.paginaSlug) }]}
              post={{
                id: p.id,
                titulo: p.titulo,
                corpo: p.corpo,
                imagemUrl: p.imagemUrl,
                formato: p.formato,
                fixado: p.fixado,
                publicado: p.publicado,
                avisoTipo: p.avisoTipo,
                agendadoPara: agenda.get(p.id) ?? null,
                paginaSlug: p.paginaSlug,
              }}
            />
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
