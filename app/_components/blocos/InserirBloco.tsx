"use client";

import { useEffect, useState } from "react";
import { BLOCOS, TIPOS } from "@/lib/blocos";
import { adicionarBloco } from "../../painel/paginas/actions";
import { Icone } from "../Icone";

/** "+ Adicionar bloco": abre a lista de tipos de bloco e cria o escolhido neste ponto da página. */
export default function InserirBloco({
  paginaId,
  depois,
  retorno,
  grande = false,
  desativado = false,
}: {
  paginaId: string;
  depois: string;
  retorno: string;
  grande?: boolean;
  desativado?: boolean;
}) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = antes;
    };
  }, [aberto]);

  return (
    <>
      <div className={`inserir${grande ? " grande" : ""}`}>
        <button type="button" onClick={() => setAberto(true)} disabled={desativado}>
          <span aria-hidden="true">＋</span> Adicionar bloco
        </button>
      </div>
      {aberto && (
        <div className="modal-fundo" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setAberto(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Escolha o tipo de bloco">
            <header className="modal-topo">
              <b>Que bloco você quer adicionar?</b>
              <button type="button" className="x" aria-label="Fechar" onClick={() => setAberto(false)}>×</button>
            </header>
            <div className="modal-corpo">
              <div className="tipos-grade">
                {TIPOS.map((t) => (
                  <form action={adicionarBloco} key={t}>
                    <input type="hidden" name="pagina_id" value={paginaId} />
                    <input type="hidden" name="depois" value={depois} />
                    <input type="hidden" name="retorno" value={retorno} />
                    <input type="hidden" name="tipo" value={t} />
                    <button type="submit" className="tipo-card" onClick={() => setTimeout(() => setAberto(false), 0)}>
                      <span className="ic"><Icone nome={BLOCOS[t].icone} /></span>
                      <b>{BLOCOS[t].nome}</b>
                      <small>{BLOCOS[t].descricao}</small>
                    </button>
                  </form>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
