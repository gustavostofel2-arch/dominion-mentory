"use client";

import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import MenuPontos, { type ItemMenu } from "./MenuPontos";
import type { PostEditavel } from "./CamposPost";
import { alternarAvisoPost, excluirPost, fixarPost } from "../painel/admin/actions";

// o editor (Tiptap) só é baixado quando um admin abre a edição
const EditarPostModal = dynamic(() => import("./EditarPostModal"), { ssr: false });

/** ⋯ da postagem para admins: editar, fixar, virar aviso, copiar link e excluir. */
export default function PostMenu({ post }: { post: PostEditavel }) {
  const retorno = usePathname();
  const [editando, setEditando] = useState(false);
  const params = useSearchParams();

  // depois de salvar (a ação volta com ?ok= ou ?erro=), fecha a janela de edição
  useEffect(() => {
    if (params.get("ok") || params.get("erro")) setEditando(false);
  }, [params]);

  const base = { id: post.id, retorno };
  const itens: ItemMenu[] = [
    { rotulo: "Editar", aoClicar: () => setEditando(true) },
    { rotulo: post.fixado ? "Desafixar do topo" : "Fixar no topo", acao: fixarPost, campos: { ...base, fixar: post.fixado ? "0" : "1" } },
    post.publicado
      ? {
          rotulo: post.avisoTipo ? "Remover dos avisos do Início" : "Transformar em aviso",
          acao: alternarAvisoPost,
          campos: { ...base, ligar: post.avisoTipo ? "0" : "1" },
        }
      : { rotulo: "Publicar para virar aviso", aoClicar: () => setEditando(true) },
    {
      rotulo: "Copiar link",
      aoClicar: () => {
        const url = `${window.location.origin}/painel/novidades/${post.id}`;
        navigator.clipboard?.writeText(url).catch(() => undefined);
      },
    },
    { rotulo: "Excluir", acao: excluirPost, campos: base, perigo: true, confirmar: "Excluir esta postagem, com curtidas e comentários? Não dá para desfazer." },
  ];

  return (
    <>
      <MenuPontos itens={itens} rotulo="Opções da postagem" />
      {editando && <EditarPostModal post={post} retorno={retorno} aoFechar={() => setEditando(false)} />}
    </>
  );
}
