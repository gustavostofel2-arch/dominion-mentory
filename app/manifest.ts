import type { MetadataRoute } from "next";

// Faz o site poder ser instalado como app (necessário para receber push no iPhone).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Dominion Mentory",
    short_name: "Dominion",
    description: "Painel dos mentorados da Dominion Mentory.",
    start_url: "/painel",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
