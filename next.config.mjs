/** @type {import('next').NextConfig} */
const nextConfig = {
  // Os HTMLs das ferramentas, as imagens e os workflows ficam em /private e são
  // lidos pelo servidor (depois de checar o login). Sem isto a Vercel não os
  // empacota junto com as funções.
  outputFileTracingIncludes: {
    "/ferramentas/[slug]": ["./private/ferramentas/**/*"],
    "/img/[file]": ["./private/img/**/*"],
    "/workflows/[file]": ["./private/workflows/**/*"],
  },
  poweredByHeader: false,
};

export default nextConfig;
