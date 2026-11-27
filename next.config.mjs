/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // web-push é CommonJS e roda só no servidor: carregado direto pelo Node.
  serverExternalPackages: ["web-push"],
  // Upload de imagens do Admin (já comprimidas no navegador) passa por server actions.
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
    // trocar de aba e voltar em até 30 s reaproveita a tela já carregada (salvar no Admin e o tempo real atualizam na hora)
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
