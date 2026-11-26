import { ImageResponse } from "next/og";
import { ICONE_BASE64 } from "@/lib/iconeBase";

// Gera os ícones do app instalável e do push: /icons/icon-192.png, /icons/icon-512.png e /icons/badge-96.png
export async function GET(_req: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params;

  if (nome === "badge-96.png") {
    // Ícone pequeno da barra de notificações do Android: só a silhueta, em branco.
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="80" height="80" viewBox="0 0 64 64">
            <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill="white" />
            <rect x="8" y="49" width="48" height="7" rx="2" fill="white" />
          </svg>
        </div>
      ),
      { width: 96, height: 96 },
    );
  }

  const tamanho = nome === "icon-512.png" ? 512 : nome === "icon-192.png" ? 192 : 0;
  if (!tamanho) return new Response("Não encontrado", { status: 404 });

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0b" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${ICONE_BASE64}`} width={tamanho} height={tamanho} alt="" />
      </div>
    ),
    { width: tamanho, height: tamanho },
  );
}
