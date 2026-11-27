"use client";

import { useState } from "react";
import EditorTexto from "./EditorTexto";
import UploadImagem from "./UploadImagem";
import CampoEmoji from "./CampoEmoji";
import { useDestinos } from "./Destinos";

export type PostEditavel = {
  id: string;
  titulo: string;
  corpo: string;
  imagemUrl: string | null;
  formato: string | null;
  fixado: boolean;
  publicado: boolean;
  avisoTipo: "info" | "importante" | "urgente" | null;
  /** Página onde está publicada (slug). Vazio = Novidades. */
  paginaSlug?: string | null;
  /** Se a publicação está agendada: data no formato do campo (horário de Brasília). */
  agendadoPara?: string | null;
};

/** Campos da postagem, iguais ao criar (Admin) e ao editar (menu ⋯ no feed). */
export default function CamposPost({ post, retorno, destino }: { post?: PostEditavel; retorno: string; destino?: string }) {
  const destinos = useDestinos();
  const inicial = post ? post.paginaSlug ?? "" : destino ?? "";
  const [virarAviso, setVirarAviso] = useState(!!post?.avisoTipo);
  return (
    <div className="campos-post">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="retorno" value={retorno} />

      <CampoEmoji nome="titulo" rotulo="Título" max={160} obrigatorio inicial={post?.titulo} placeholder="Ex.: 🔥 Nova aula: como escalar contas" />

      <div className="fld">
        <label>Texto</label>
        <EditorTexto valor={post?.corpo ?? ""} />
      </div>

      <UploadImagem atual={post?.imagemUrl} formatoAtual={post?.formato} />

      <div className="fld">
        <label>Onde publicar</label>
        <select name="pagina_slug" defaultValue={destinos.some((d) => d.slug === inicial) ? inicial : ""}>
          <option value="">Novidades</option>
          {destinos.filter((d) => d.slug !== "novidades").map((d) => <option key={d.slug} value={d.slug}>{d.rotulo}</option>)}
        </select>
        <p className="dica">A postagem aparece só nessa página (e no Início, se você destacar).</p>
      </div>

      <fieldset className="opcoes">
        <legend>Onde aparece</legend>
        <label className="chk">
          <input type="checkbox" name="publicado" defaultChecked={post ? post.publicado : true} />
          <span><b>Publicada</b> em Novidades <small>(desmarque para guardar como rascunho)</small></span>
        </label>
        <label className="chk">
          <input type="checkbox" name="fixado" defaultChecked={post?.fixado ?? false} />
          <span><b>Destacar</b> <small>(fica no topo da página e aparece no Início, com o selo “Destaque”)</small></span>
        </label>
      </fieldset>

      <fieldset className="opcoes aviso-op">
        <legend>Aviso no Início</legend>
        <label className="chk">
          <input type="checkbox" name="virar_aviso" checked={virarAviso} onChange={(e) => setVirarAviso(e.target.checked)} />
          <span>
            <b>Transformar esta postagem em aviso</b>
            <small>Para algo urgente ou importante (ex.: call hoje). Aparece no carrossel do Início e, ao tocar, leva para esta postagem.</small>
          </span>
        </label>
        {virarAviso && (
          <div className="fgrid">
            <div className="fld">
              <label>Destaque do aviso</label>
              <select name="aviso_tipo" defaultValue={post?.avisoTipo ?? "importante"}>
                <option value="info">Aviso (azul)</option>
                <option value="importante">Importante (dourado)</option>
                <option value="urgente">Urgente (vermelho pulsando)</option>
              </select>
            </div>
            <div className="fld">
              <label>Fica no ar por</label>
              <select name="aviso_dias" defaultValue={post?.avisoTipo ? "manter" : "1"}>
                {post?.avisoTipo && <option value="manter">Manter como está</option>}
                <option value="1">24 horas</option>
                <option value="3">3 dias</option>
                <option value="7">7 dias</option>
                <option value="0">Sem prazo (até eu tirar)</option>
              </select>
            </div>
            <p className="dica full">Dica: se quiser a imagem no aviso, use o formato <b>Banner 16:9</b> acima.</p>
          </div>
        )}
      </fieldset>

      <fieldset className="opcoes">
        <legend>Agendar publicação</legend>
        <div className="fld">
          <label>Publicar em (opcional, horário de Brasília)</label>
          <input type="datetime-local" name="agendar_em" defaultValue={post?.agendadoPara ?? ""} />
          <p className="dica">
            Deixe vazio para publicar agora (ou guardar como rascunho). Com data e hora, a postagem fica guardada e é publicada sozinha no horário,
            já com o aviso e a notificação que você marcou aqui. Acompanhe em <b>Admin → Agenda</b>.
          </p>
        </div>
      </fieldset>

      <label className="chk notificar">
        <input type="checkbox" name="notificar" />
        <span><b>Notificar toda a comunidade</b> (sino + push no celular e computador)</span>
      </label>
    </div>
  );
}
