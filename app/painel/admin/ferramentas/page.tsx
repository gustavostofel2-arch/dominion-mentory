import { lerCatalogoCompleto, type Item, type Modulo } from "@/lib/catalogo";
import { ICONES_NOMES } from "@/lib/conteudo";
import {
  criarItem,
  criarModulo,
  excluirItem,
  excluirModulo,
  moverItem,
  moverModulo,
  salvarItem,
  salvarModulo,
} from "../actions";
import ConfirmButton from "../ConfirmButton";
import BotaoAcao from "../BotaoAcao";

const CORES = [
  ["op", "Dourado"],
  ["calc", "Verde"],
  ["ia", "Azul"],
  ["aula", "Laranja"],
] as const;

function CamposItem({ modulos, item, moduloId }: { modulos: Modulo[]; item?: Item; moduloId?: string }) {
  return (
    <div className="fgrid">
      <div className="fld full">
        <label>Nome</label>
        <input type="text" name="titulo" required maxLength={120} defaultValue={item?.titulo} placeholder="Ex.: Calculadora de Retorno" />
      </div>
      <div className="fld full">
        <label>Descrição</label>
        <textarea name="descricao" maxLength={400} defaultValue={item?.descricao} placeholder="O que a pessoa vai encontrar ao abrir." />
      </div>
      <div className="fld full">
        <label>Link do artefato ou site</label>
        <input type="text" inputMode="url" name="url" required maxLength={600} defaultValue={item?.url} placeholder="https://claude.ai/artifact/..." />
      </div>
      <div className="fld">
        <label>Etiqueta (ex.: Guia, Prompts, Aula)</label>
        <input type="text" name="tag" maxLength={30} defaultValue={item?.tag} />
      </div>
      <div className="fld">
        <label>Ícone</label>
        <select name="icone" defaultValue={item?.icone ?? "grid"}>
          {Object.entries(ICONES_NOMES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="fld full">
        <label>Módulo</label>
        <select name="modulo_id" defaultValue={item?.moduloId ?? moduloId}>
          {modulos.map((m) => (
            <option key={m.id} value={m.id}>{m.titulo}</option>
          ))}
        </select>
      </div>
      <label className="chk">
        <input type="checkbox" name="visivel" defaultChecked={item ? item.visivel : true} /> Visível para os alunos
      </label>
      <label className="chk">
        <input type="checkbox" name="destaque" defaultChecked={item?.destaque ?? false} /> Card grande no topo (“Comece aqui”)
      </label>
    </div>
  );
}

export default async function AdminFerramentas() {
  // as mensagens (?ok= / ?erro=) são lidas no navegador pelo MensagemAdmin; a página não depende da URL
  const searchParams = Promise.resolve({} as { ok?: string; erro?: string });
  const [{ ok, erro }, { modulos, doBanco }] = await Promise.all([searchParams, lerCatalogoCompleto()]);

  return (
    <>
      {ok && <div className="nota">{ok}</div>}
      {erro && <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>{erro}</div>}

      {!doBanco ? (
        <div className="nota">
          As tabelas ainda não existem no Supabase. Abra o <b>SQL Editor</b>, cole o arquivo{" "}
          <code>supabase/comunidade-etapa1.sql</code> e clique em <b>Run</b>. Depois, recarregue esta página para editar.
        </div>
      ) : (
        <>
          <div className="panel">
            <h2>Novo módulo</h2>
            <form action={criarModulo} className="fgrid">
              <div className="fld">
                <label>Nome do módulo</label>
                <input type="text" name="titulo" required maxLength={80} placeholder="Ex.: Lives e vendas" />
              </div>
              <div className="fld">
                <label>Cor da etiqueta</label>
                <select name="cor" defaultValue="op">
                  {CORES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="full"><button className="btn primary" type="submit">Criar módulo</button></div>
            </form>
          </div>

          {modulos.map((m, mi) => (
            <div className="panel" key={m.id}>
              <details className="it" style={{ marginTop: 0 }}>
                <summary>
                  <span>{m.titulo}</span>
                  {!m.visivel && <span className="badge-off">escondido</span>}
                  <span className="meta">{m.itens.length} ferramenta(s) · editar módulo</span>
                </summary>
                <form>
                  <input type="hidden" name="id" value={m.id} />
                  <div className="fgrid">
                    <div className="fld">
                      <label>Nome do módulo</label>
                      <input type="text" name="titulo" required maxLength={80} defaultValue={m.titulo} />
                    </div>
                    <div className="fld">
                      <label>Cor da etiqueta</label>
                      <select name="cor" defaultValue={m.cor}>
                        {CORES.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <label className="chk full">
                      <input type="checkbox" name="visivel" defaultChecked={m.visivel} /> Visível para os alunos
                    </label>
                  </div>
                  <div className="acts">
                    <button className="btn primary mini" type="submit" formAction={salvarModulo}>Salvar módulo</button>
                    <BotaoAcao action={moverModulo} campos={{ dir: "up" }} className="btn mini" disabled={mi === 0}>↑ Subir</BotaoAcao>
                    <BotaoAcao action={moverModulo} campos={{ dir: "down" }} className="btn mini" disabled={mi === modulos.length - 1}>↓ Descer</BotaoAcao>
                    <ConfirmButton action={excluirModulo} msg={`Excluir o módulo “${m.titulo}” e TODAS as ferramentas dele?`} className="btn danger mini">Excluir módulo</ConfirmButton>
                  </div>
                </form>
              </details>

              {m.itens.map((it, ii) => (
                <details className="it" key={it.id}>
                  <summary>
                    <span>{it.titulo}</span>
                    {it.destaque && <span className="badge-off" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>destaque</span>}
                    {!it.visivel && <span className="badge-off">escondido</span>}
                    <span className="meta">{it.tag}</span>
                  </summary>
                  <form>
                    <input type="hidden" name="id" value={it.id} />
                    <input type="hidden" name="modulo_atual" value={m.id} />
                    <CamposItem modulos={modulos} item={it} />
                    <div className="acts">
                      <button className="btn primary mini" type="submit" formAction={salvarItem}>Salvar</button>
                      <BotaoAcao action={moverItem} campos={{ dir: "up" }} className="btn mini" disabled={ii === 0}>↑ Subir</BotaoAcao>
                      <BotaoAcao action={moverItem} campos={{ dir: "down" }} className="btn mini" disabled={ii === m.itens.length - 1}>↓ Descer</BotaoAcao>
                      <a className="btn mini" href={it.url} target="_blank" rel="noopener noreferrer">Testar link</a>
                      <ConfirmButton action={excluirItem} msg={`Excluir “${it.titulo}”?`} className="btn danger mini">Excluir</ConfirmButton>
                    </div>
                  </form>
                </details>
              ))}

              <details className="it" style={{ borderStyle: "dashed" }}>
                <summary><span>+ Nova ferramenta em “{m.titulo}”</span></summary>
                <form action={criarItem}>
                  <CamposItem modulos={modulos} moduloId={m.id} />
                  <div className="acts"><button className="btn primary mini" type="submit">Criar ferramenta</button></div>
                </form>
              </details>
            </div>
          ))}
        </>
      )}
    </>
  );
}
