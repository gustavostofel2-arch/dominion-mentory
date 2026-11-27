/** Avisos flutuantes (toasts): qualquer parte do app chama mostrarToast() e o componente <Toasts /> desenha. */
export type ToastDados = { texto: string; link?: string; icone?: string; tipo?: "info" | "ok" | "erro"; sub?: string };

export function mostrarToast(d: ToastDados) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("dm:toast", { detail: d }));
}
