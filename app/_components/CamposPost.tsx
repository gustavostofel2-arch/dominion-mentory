"use client";

import { useState } from "react";
import EditorTexto from "./EditorTexto";
import UploadImagem from "./UploadImagem";

export type PostEditavel = {
  id: string;
  titulo: string;
  corpo: string;
  imagemUrl: string | null;
  formato: string | null;
  fixado: boolean;
  publicado: boolean;
  avisoTipo: "info" | "importante" | "urgente" | null;
};

/** Campos da postagem, iguais ao criar (Admin) e ao editar (menu ⋯ no feed). */
export default function CamposPost({ post, retorno }: { post?: PostEditavel; retorno: string }) {
  const [virarAviso, setVirarAviso] = useState(!!post?.avisoTipo);
  return (
    <div className="campos-post">
      {post && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="retorno" value={retorno} />

      <div className="fld">
        <label>Título</label>
        <input type="text" name="titulo" required maxLength={160} defaultValue={post?.titulo} placeholder="Ex.: Nova aula: como escalar contas" />
      </div>

      <div className="fld">
        <label>Texto</label>
        <EditorTexto valor={post?.corpo ?? ""} />
      </div>

      <UploadImagem atual={post?.imagemUrl} formatoAtual={post?.formato} />

      <fieldset className="opcoes">
        <legend>Onde aparece</legend>
        <label className="chk">
          <input type="checkbox" name="publicado" defaultChecked={post ? post.publicado : true} />
          <span><b>Publicada</b> em Novidades <small>(desmarque para guardar como rascunho)</small></span>
        </label>
        <label className="chk">
          <input type="checkbox" name="fixado" defaultChecked={post?.fixado ?? false} />
          <span><b>Fixar no topo</b> das Novidades <small>(fica sempre em primeiro, com o selo “Fixado”)</small></span>
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

      <label className="chk notificar">
        <input type="checkbox" name="notificar" />
        <span><b>Notificar toda a comunidade</b> (sino + push no celular e computador)</span>
      </label>
    </div>
  );
}
