import { lerAvisosAdmin, type Aviso } from "@/lib/catalogo";
import { criarAviso, excluirAviso, salvarAviso } from "../actions";
import ConfirmButton from "../ConfirmButton";
import UploadImagem from "../../../_components/UploadImagem";

/** timestamptz -> "2026-11-30T18:00" no horário de Brasília, para o campo de data. */
function paraCampo(iso: string | null): string {
  if (!iso) return "";
  const s = new Date(iso).toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
  return s.replace(" ", "T").slice(0, 16);
}

function Campos({ a }: { a?: Aviso }) {
  return (
    <div className="fgrid">
      <div className="fld full">
        <label>Título</label>
        <input type="text" name="titulo" required maxLength={140} defaultValue={a?.titulo} placeholder="Ex.: Call hoje às 20h" />
      </div>
      <div className="fld full">
        <label>Texto (opcional)</label>
        <textarea name="texto" maxLength={800} defaultValue={a?.texto} placeholder="Detalhes do aviso. Quebras de linha funcionam." />
      </div>
      <div className="fld">
        <label>Destaque</label>
        <select name="tipo" defaultValue={a?.tipo ?? "info"}>
          <option value="info">Aviso (azul)</option>
          <option value="importante">Importante (dourado)</option>
          <option value="urgente">Urgente (vermelho pulsando)</option>
        </select>
      </div>
      <div className="fld">
        <label>Sai do ar em (horário de Brasília)</label>
        <input type="datetime-local" name="expira_em" defaultValue={paraCampo(a?.expiraEm ?? null)} />
      </div>
      <div className="fld">
        <label>Link do botão (opcional)</label>
        <input type="url" name="link_url" maxLength={600} defaultValue={a?.linkUrl ?? ""} placeholder="https://..." />
      </div>
      <div className="fld">
        <label>Texto do botão</label>
        <input type="text" name="link_texto" maxLength={40} defaultValue={a?.linkTexto ?? ""} placeholder="Entrar na call" />
      </div>
      <div className="full">
        <UploadImagem atual={a?.imagemUrl} formatoFixo="banner" />
      </div>
      <label className="chk full">
        <input type="checkbox" name="ativo" defaultChecked={a ? a.ativo : true} /> No ar (aparece para os alunos)
      </label>
      <label className="chk notificar full">
        <input type="checkbox" name="notificar" /> <span><b>Notificar toda a comunidade</b> (sino + push no celular e computador)</span>
      </label>
    </div>
  );
}

export default async function AdminAvisos({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const [{ ok, erro }, avisos] = await Promise.all([searchParams, lerAvisosAdmin()]);
  const agora = Date.now();

  return (
    <>
      {ok && <div className="nota">{ok}</div>}
      {erro && <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>{erro}</div>}

      <div className="panel">
        <h2>Novo aviso</h2>
        <form action={criarAviso}>
          <Campos />
          <div className="acts">
            <button className="btn primary" type="submit">Publicar aviso</button>
          </div>
        </form>
      </div>

      <h3 style={{ fontSize: ".95rem", margin: "26px 0 4px" }}>Avisos criados</h3>
      {avisos.length === 0 && <p style={{ color: "var(--muted)" }}>Nenhum aviso ainda.</p>}
      {avisos.map((a) => {
        const vencido = !!a.expiraEm && new Date(a.expiraEm).getTime() <= agora;
        return (
          <details className="it" key={a.id}>
            <summary>
              <span>{a.titulo}</span>
              {!a.ativo && <span className="badge-off">desligado</span>}
              {vencido && <span className="badge-off">vencido</span>}
              <span className="meta">{a.tipo}</span>
            </summary>
            <form>
              <input type="hidden" name="id" value={a.id} />
              <Campos a={a} />
              <div className="acts">
                <button className="btn primary mini" type="submit" formAction={salvarAviso}>Salvar</button>
                <ConfirmButton action={excluirAviso} msg="Excluir este aviso?" className="btn danger mini">Excluir</ConfirmButton>
              </div>
            </form>
          </details>
        );
      })}
    </>
  );
}
