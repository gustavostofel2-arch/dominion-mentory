import { ICONES } from "@/lib/conteudo";

export function Icone({ nome }: { nome: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ICONES[nome] ?? ICONES.grid }}
    />
  );
}
