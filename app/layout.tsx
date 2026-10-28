import type { Metadata, Viewport } from "next";
import "./globals.css";

const ICONE = "https://yhmteuxogzxdjevxlucv.supabase.co/storage/v1/object/public/flow/icon.png";

export const metadata: Metadata = {
  title: "Dominion Mentory",
  description:
    "Dominion Mentory: mentoria para escalar a operação de TikTok Shop com multicontas. Sistema exclusivo para mentorados.",
  icons: { icon: ICONE, apple: ICONE },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=DM+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
