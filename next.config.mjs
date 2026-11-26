/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Upload de imagens do Admin (já comprimidas no navegador) passa por server actions.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
