"use server";

import { exigirAdmin } from "@/lib/admin";
import { emailLogado } from "@/lib/admin";
import { ehTipo, normalizarDados, type TipoBloco } from "@/lib/blocos";
import ConteudoBloco from "../../_components/blocos/ConteudoBloco";

/**
 * Prévia ao vivo do editor de blocos: devolve o bloco já desenhado (o mesmo desenho que os alunos veem),
 * a partir do que está digitado, sem salvar nada.
 */
export async function previaBloco(tipo: string, dadosJson: string, slug: string) {
  await exigirAdmin();
  if (!ehTipo(tipo) || dadosJson.length > 400000) return null;
  let bruto: unknown = {};
  try {
    bruto = JSON.parse(dadosJson);
  } catch {
    return null;
  }
  const dados = normalizarDados(tipo as TipoBloco, bruto);
  const email = await emailLogado();
  return (
    <ConteudoBloco
      bloco={{ id: "previa", paginaId: "", tipo: tipo as TipoBloco, dados, ordem: 0, visivel: true }}
      ctx={{ email, admin: false, slug: /^[a-z0-9-]{1,40}$/.test(slug) ? slug : "" }}
    />
  );
}
