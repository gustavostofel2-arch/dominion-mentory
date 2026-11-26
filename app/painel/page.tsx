import PaginaView from "../_components/blocos/PaginaView";

export const metadata = { title: "Início | Dominion Mentory", robots: { index: false } };

/** O Início também é uma página de blocos (slug "inicio"): editável pelo botão "Editar página". */
export default function Inicio() {
  return <PaginaView slug="inicio" />;
}
