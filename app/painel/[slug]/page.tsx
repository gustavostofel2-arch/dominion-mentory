import type { Metadata } from "next";
import PaginaView from "../../_components/blocos/PaginaView";
import { paginaPorSlug } from "@/lib/paginas";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { pagina } = await paginaPorSlug(slug);
  return { title: `${pagina?.titulo ?? "Página"} | Dominion Mentory`, robots: { index: false } };
}

/** Qualquer aba criada em Admin → Menu e páginas aparece aqui: /painel/{slug}. */
export default async function PaginaDinamica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaView slug={slug} />;
}
