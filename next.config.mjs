/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // As ferramentas são arquivos estáticos em /public/ferramentas. O middleware
  // confere o acesso ANTES de qualquer arquivo ser entregue; aqui só damos o
  // endereço limpo (sem .html).
  async rewrites() {
    return {
      beforeFiles: [{ source: "/ferramentas/:slug([a-z0-9-]+)", destination: "/ferramentas/:slug.html" }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
