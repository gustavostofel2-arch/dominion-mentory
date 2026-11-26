"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dados, TipoBloco } from "@/lib/blocos";
import { BLOCOS } from "@/lib/blocos";
import { alternarBloco, duplicarBloco, excluirBloco, moverBloco } from "../../painel/paginas/actions";
import MenuPontos, { type ItemMenu } from "../MenuPontos";
import type { ModuloOpcao } from "./FormBloco";

// o formulário (e o editor de texto) só é baixado quando um admin abre a edição
const FormBloco = dynamic(() => import("./FormBloco"), { ssr: false });

/** Moldura do modo edição: nome do bloco, botão Editar e o menu ⋯ (mover, duplicar, ocultar, excluir). */
export default function MolduraBloco({
  bloco,
  primeiro,
  ultimo,
  retorno,
  modulos,
  somenteLeitura,
  children,
}: {
  bloco: { id: string; tipo: TipoBloco; dados: Dados; visivel: boolean };
  primeiro: boolean;
  ultimo: boolean;
  retorno: string;
  modulos: ModuloOpcao[];
  somenteLeitura: boolean;
  children: React.ReactNode;
}) {
  const [editando, setEditando] = useState(false);
  const params = useSearchParams();
  const def = BLOCOS[bloco.tipo];
  const base = { id: bloco.id, retorno };

  // bloco recém-criado: já abre a edição
  useEffect(() => {
    if (!somenteLeitura && params.get("novo") === bloco.id) setEditando(true);
  }, [params, bloco.id, somenteLeitura]);

  const itens: ItemMenu[] = somenteLeitura
    ? []
    : [
        ...(primeiro ? [] : [{ rotulo: "Mover para cima", acao: moverBloco, campos: { ...base, dir: "up" } }]),
        ...(ultimo ? [] : [{ rotulo: "Mover para baixo", acao: moverBloco, campos: { ...base, dir: "down" } }]),
        { rotulo: "Duplicar", acao: duplicarBloco, campos: base },
        { rotulo: bloco.visivel ? "Ocultar dos alunos" : "Mostrar para os alunos", acao: alternarBloco, campos: { ...base, mostrar: bloco.visivel ? "0" : "1" } },
        { rotulo: "Excluir bloco", acao: excluirBloco, campos: base, perigo: true, confirmar: `Excluir o bloco “${def.nome}”? Não dá para desfazer.` },
      ];

  return (
    <div className={`moldura${bloco.visivel ? "" : " oculto"}`} id={`bloco-${bloco.id}`}>
      <div className="mold-barra">
        <span className="mold-tipo">
          {def.nome}
          {!bloco.visivel && <em> · oculto</em>}
        </span>
        <span className="mold-acoes">
          {def.campos.length > 0 && (
            <button type="button" className="btn mini" onClick={() => setEditando(true)} disabled={somenteLeitura}>
              ✎ Editar
            </button>
          )}
          <MenuPontos itens={itens} rotulo={`Opções do bloco ${def.nome}`} classe="mini" />
        </span>
      </div>
      <div className="mold-corpo">{children}</div>
      {editando && <FormBloco bloco={bloco} retorno={retorno} modulos={modulos} aoFechar={() => setEditando(false)} />}
    </div>
  );
}
