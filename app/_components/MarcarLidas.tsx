"use client";

import { useEffect } from "react";
import { abrirSino } from "../painel/notificacoes/actions";

/** Ao abrir a página de notificações, marca tudo como lido (e zera o número vermelho do sino). */
export default function MarcarLidas() {
  useEffect(() => {
    void abrirSino().catch(() => undefined);
  }, []);
  return null;
}
