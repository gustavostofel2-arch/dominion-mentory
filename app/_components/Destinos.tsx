"use client";

import { createContext, useContext } from "react";

export type Destino = { slug: string; rotulo: string };

const Ctx = createContext<Destino[]>([]);

/** Lista de páginas onde uma postagem pode ser publicada (vem do menu do painel). */
export function DestinosProvider({ destinos, children }: { destinos: Destino[]; children: React.ReactNode }) {
  return <Ctx.Provider value={destinos}>{children}</Ctx.Provider>;
}

export const useDestinos = () => useContext(Ctx);
