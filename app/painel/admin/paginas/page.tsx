import { carregarPainel, rotuloMenu } from "@/lib/paginas";
import { alternarEdicao, criarPagina, excluirPagina, moverPagina, restaurarPaginasPadrao, salvarPagina } from "../../paginas/actions";
import ConfirmButton from "../ConfirmButton";
import BotaoAcao from "../BotaoAcao";
import EscolherIcone from "../../../_components/EscolherIcone";
import { Icone } from "../../../_components/Icone";

const RETORNO = "/painel/admin/paginas";
const MODELOS = [
  ["branco", "Em branco"],
  ["texto", "Com um texto"],
  ["faq", "Com perguntas e respostas"],
  ["imagem_texto", "Com imagem e texto"],
  ["cartoes", "Com cartões e links"],
  ["ferramentas", "Com as ferramentas"],
  ["feed", "Com as postagens"],
] as const;

export default async function AdminPaginas() {
  // as mensagens (?ok= / ?erro=) são lidas no navegador pelo MensagemAdmin; a página não depende da URL
  const searchParams = Promise.resolve({} as { ok?: string; erro?: string });
  const [{ ok, erro }, { paginas, doBanco }] = await Promise.all([searchParams, carregarPainel()]);

  return (
    <>
      {ok && <div className="nota">{ok}</div>}
      {erro && <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>{erro}</div>}

      <div className="explica">
        <div><b>Aba = página</b><span>Cada item do menu lateral é uma página. Crie, renomeie, mude a ordem, esconda ou apague.</span></div>
        <div><b>Blocos</b><span>O conteúdo de cada página é feito de blocos (texto, imagem, perguntas, ferramentas, postagens…). Abra a página e use “Editar página”.</span></div>
      </div>

      {!doBanco ? (
        <div className="nota">
          As tabelas de páginas ainda não existem no Supabase. No <b>SQL Editor</b>, rode <code>supabase/comunidade-etapa5.sql</code> e recarregue. Até lá
          o site usa as páginas padrão, em modo somente leitura.
        </div>
      ) : (
        <>
          <div className="panel" id="nova">
            <h2>Nova página</h2>
            <form action={criarPagina}>
              <input type="hidden" name="retorno" value={RETORNO} />
              <div className="fgrid">
                <div className="fld">
                  <label>Nome da página</label>
                  <input type="text" name="titulo" required maxLength={80} placeholder="Ex.: Aulas gravadas" />
                </div>
                <div className="fld">
                  <label>Começar com</label>
                  <select name="modelo" defaultValue="branco">
                    {MODELOS.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                  </select>
                </div>
                <div className="fld full">
                  <label>Ícone no menu</label>
                  <EscolherIcone />
                </div>
              </div>
              <div className="acts"><button className="btn primary" type="submit">Criar página</button></div>
            </form>
          </div>

          <h3 style={{ fontSize: ".95rem", margin: "26px 0 4px" }}>Páginas do menu</h3>
          {paginas.map((p, i) => (
            <details className="it" key={p.id} id={p.slug}>
              <summary>
                <span className="ic-mini"><Icone nome={p.icone} /></span>
                <span>{rotuloMenu(p)}</span>
                {p.protegida && <span className="badge-off" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>protegida</span>}
                {!p.visivel && <span className="badge-off">oculta</span>}
                {!p.noMenu && <span className="badge-off">fora do menu</span>}
                <span className="meta">/{p.slug === "inicio" ? "painel" : `painel/${p.slug}`} · {p.blocos.length} bloco(s)</span>
              </summary>
              <form>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="retorno" value={RETORNO} />
                <input type="hidden" name="ligar" value="1" />
                <div className="fgrid">
                  <div className="fld">
                    <label>Nome da página (título)</label>
                    <input type="text" name="titulo" required maxLength={80} defaultValue={p.titulo} />
                  </div>
                  <div className="fld">
                    <label>Nome curto no menu (opcional)</label>
                    <input type="text" name="menu_rotulo" maxLength={40} defaultValue={p.menuRotulo ?? ""} placeholder={p.titulo} />
                  </div>
                  <div className="fld">
                    <label>Endereço</label>
                    <input type="text" name="slug" maxLength={40} defaultValue={p.slug} disabled={p.protegida} placeholder="ex.: aulas-gravadas" />
                  </div>
                  <div className="fld">
                    <label>Texto pequeno acima do título (opcional)</label>
                    <input type="text" name="etiqueta" maxLength={60} defaultValue={p.etiqueta ?? ""} />
                  </div>
                  <div className="fld full">
                    <label>Frase abaixo do título (opcional)</label>
                    <textarea name="descricao" maxLength={400} defaultValue={p.descricao ?? ""} />
                  </div>
                  <div className="fld full">
                    <label>Ícone no menu</label>
                    <EscolherIcone valor={p.icone} />
                  </div>
                  <label className="chk"><input type="checkbox" name="no_menu" defaultChecked={p.noMenu} /> Aparece no menu lateral</label>
                  <label className="chk"><input type="checkbox" name="mostrar_cabecalho" defaultChecked={p.mostrarCabecalho} /> Mostrar título no topo da página</label>
                  {!p.protegida && (
                    <label className="chk"><input type="checkbox" name="visivel" defaultChecked={p.visivel} /> Visível para os alunos (desmarque para esconder)</label>
                  )}
                </div>
                <div className="acts">
                  <button className="btn primary mini" type="submit" formAction={salvarPagina}>Salvar</button>
                  <BotaoAcao action={alternarEdicao} campos={{ destino: p.slug === "inicio" ? "/painel" : `/painel/${p.slug}` }} className="btn mini">✎ Editar o conteúdo</BotaoAcao>
                  <BotaoAcao action={moverPagina} campos={{ dir: "up" }} className="btn mini" disabled={i === 0}>↑ Subir</BotaoAcao>
                  <BotaoAcao action={moverPagina} campos={{ dir: "down" }} className="btn mini" disabled={i === paginas.length - 1}>↓ Descer</BotaoAcao>
                  {!p.protegida && (
                    <ConfirmButton action={excluirPagina} msg={`Excluir a página “${p.titulo}”, os blocos e as postagens dela? Não dá para desfazer.`} className="btn danger mini">Excluir página</ConfirmButton>
                  )}
                </div>
              </form>
            </details>
          ))}

          <form action={restaurarPaginasPadrao} style={{ marginTop: 22 }}>
            <button className="btn mini" type="submit">Restaurar páginas padrão que estiverem faltando</button>
            <p className="dica" style={{ marginTop: 6 }}>Recria Início, Novidades, Ferramentas, Flow, Race ou Regras se você apagou alguma sem querer. Não mexe nas que já existem.</p>
          </form>
        </>
      )}
    </>
  );
}
