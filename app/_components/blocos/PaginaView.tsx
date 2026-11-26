import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { carregarCatalogo } from "@/lib/catalogo";
import { emailLogado, ehAdminParaMenu } from "@/lib/admin";
import { paginaPorSlug } from "@/lib/paginas";
import { alternarEdicao } from "../../painel/paginas/actions";
import { COOKIE_EDICAO } from "@/lib/edicao";
import Cabecalho from "../Cabecalho";
import Rodape from "../Rodape";
import ConteudoBloco from "./ConteudoBloco";
import InserirBloco from "./InserirBloco";
import MolduraBloco from "./MolduraBloco";

export function caminhoDaPagina(slug: string) {
  return slug === "inicio" ? "/painel" : `/painel/${slug}`;
}

/** Desenha uma página do painel (menu dinâmico): cabeçalho + blocos, com o modo edição para admins. */
export default async function PaginaView({ slug }: { slug: string }) {
  const email = await emailLogado();
  const [{ pagina, doBanco }, admin] = await Promise.all([paginaPorSlug(slug), ehAdminParaMenu(email)]);
  if (!pagina || (!pagina.visivel && !admin)) notFound();

  const retorno = caminhoDaPagina(pagina.slug);
  const editando = (await cookies()).get(COOKIE_EDICAO)?.value;
  const editar = admin && editando === retorno;
  const blocos = editar ? pagina.blocos : pagina.blocos.filter((b) => b.visivel);
  const modulos = editar ? (await carregarCatalogo()).map((m) => ({ id: m.id, titulo: m.titulo })) : [];
  const ctx = { email, admin };

  return (
    <>
      {admin && (
        <div className={`barra-edicao${editar ? " on" : ""}`}>
          {editar ? (
            <>
              <span><b>Modo edição.</b> Use “Editar” e o ⋯ em cada bloco, e “＋ Adicionar bloco” para montar a página.</span>
              <span className="be-acoes">
                <Link className="btn mini" href={`/painel/admin/paginas#${pagina.slug}`}>Configurações da página</Link>
                <form action={alternarEdicao}>
                  <input type="hidden" name="destino" value={retorno} />
                  <input type="hidden" name="ligar" value="0" />
                  <button className="btn primary mini" type="submit">Concluir edição</button>
                </form>
              </span>
            </>
          ) : (
            <>
              <span>{pagina.visivel ? "Você é admin: pode editar esta página." : "Esta página está oculta: só admins veem."}</span>
              <span className="be-acoes">
                <form action={alternarEdicao}>
                  <input type="hidden" name="destino" value={retorno} />
                  <input type="hidden" name="ligar" value="1" />
                  <button className="btn primary mini" type="submit">✎ Editar página</button>
                </form>
              </span>
            </>
          )}
        </div>
      )}

      {editar && !doBanco && (
        <div className="wrap" style={{ paddingTop: 16 }}>
          <div className="nota">
            As tabelas de páginas ainda não existem no Supabase, então esta página está em modo somente leitura. Rode{" "}
            <code>supabase/comunidade-etapa5.sql</code> no SQL Editor e recarregue.
          </div>
        </div>
      )}

      <main>
        {pagina.mostrarCabecalho && (
          <Cabecalho etiqueta={pagina.etiqueta ?? ""} titulo={pagina.titulo} texto={pagina.descricao ?? undefined} />
        )}

        {editar && <InserirBloco paginaId={pagina.id} depois="inicio" retorno={retorno} grande={blocos.length === 0} desativado={!doBanco} />}

        {blocos.map((b, i) => {
          const conteudo = <ConteudoBloco bloco={b} ctx={ctx} />;
          return (
            <div key={b.id} className="bl">
              {editar ? (
                <MolduraBloco
                  bloco={{ id: b.id, tipo: b.tipo, dados: b.dados, visivel: b.visivel }}
                  primeiro={i === 0}
                  ultimo={i === blocos.length - 1}
                  retorno={retorno}
                  modulos={modulos}
                  somenteLeitura={!doBanco}
                >
                  {conteudo}
                </MolduraBloco>
              ) : (
                conteudo
              )}
              {editar && <InserirBloco paginaId={pagina.id} depois={b.id} retorno={retorno} desativado={!doBanco} />}
            </div>
          );
        })}

        {!editar && blocos.length === 0 && (
          <div className="wrap" style={{ paddingTop: 32 }}>
            <div className="vazio-card">
              <b>Esta página ainda não tem conteúdo.</b>
              {admin && (
                <form action={alternarEdicao}>
                  <input type="hidden" name="destino" value={retorno} />
                  <input type="hidden" name="ligar" value="1" />
                  <button className="btn primary sm" type="submit">Adicionar blocos</button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
      <Rodape />
    </>
  );
}
