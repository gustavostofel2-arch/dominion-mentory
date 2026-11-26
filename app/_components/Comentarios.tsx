import type { Comentario } from "@/lib/feed";
import { tempoRelativo } from "@/lib/tempo";
import { apagarComentario } from "../painel/novidades/actions";
import MenuPontos from "./MenuPontos";
import { ResponderBotao, Respostas } from "./RespostaUI";

function Linha({
  c,
  postId,
  meuEmail,
  admin,
  paiId,
}: {
  c: Comentario;
  postId: string;
  meuEmail: string | null;
  admin: boolean;
  paiId: string;
}) {
  const nome = c.nome ?? "Mentorado";
  const pode = c.email === meuEmail || admin;
  return (
    <li className="cmt-i">
      <span className="av" aria-hidden="true">{nome.trim().charAt(0).toUpperCase()}</span>
      <div className="cb">
        <div className="cm-top">
          <div className="cm-quem">
            <b>{nome}</b>
            <small>{c.usuario ? `@${c.usuario}` : "mentorado"} · {tempoRelativo(c.criadoEm)}</small>
          </div>
          {pode && (
            <MenuPontos
              rotulo="Opções do comentário"
              classe="mini"
              itens={[{ rotulo: "Excluir comentário", acao: apagarComentario, campos: { id: c.id, post_id: postId }, perigo: true, confirmar: "Excluir este comentário?" }]}
            />
          )}
        </div>
        <p>{c.texto}</p>
        <div className="cm-acoes">
          <ResponderBotao postId={postId} parentId={paiId} usuario={c.usuario} />
        </div>
      </div>
    </li>
  );
}

/** Comentários no estilo Instagram: um fio por comentário principal, com as respostas embaixo. */
export default function Comentarios({
  comentarios,
  postId,
  meuEmail,
  admin,
}: {
  comentarios: Comentario[];
  postId: string;
  meuEmail: string | null;
  admin: boolean;
}) {
  const principais = comentarios.filter((c) => !c.parentId);
  const respostas = new Map<string, Comentario[]>();
  for (const c of comentarios) {
    if (c.parentId) respostas.set(c.parentId, [...(respostas.get(c.parentId) ?? []), c]);
  }

  if (!principais.length) return <p className="cm-vazio">Seja o primeiro a comentar.</p>;

  return (
    <ul className="cmt-lista">
      {principais.map((c) => {
        const filhas = respostas.get(c.id) ?? [];
        return (
          <li className="fio" key={c.id}>
            <ul>
              <Linha c={c} postId={postId} meuEmail={meuEmail} admin={admin} paiId={c.id} />
            </ul>
            {filhas.length > 0 && (
              <Respostas n={filhas.length}>
                {filhas.map((r) => (
                  <Linha key={r.id} c={r} postId={postId} meuEmail={meuEmail} admin={admin} paiId={c.id} />
                ))}
              </Respostas>
            )}
          </li>
        );
      })}
    </ul>
  );
}
