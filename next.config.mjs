/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // web-push é CommonJS e roda só no servidor: carregado direto pelo Node.
  serverExternalPackages: ["web-push"],
  // Upload de imagens do Admin (já comprimidas no navegador) passa por server actions.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
