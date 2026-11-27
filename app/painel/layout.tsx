import { Suspense } from "react";
import Link from "next/link";
import BarraProgresso from "../_components/BarraProgresso";
import "./painel.css";
import "./comunidade.css";
import { sair } from "../login/actions";
import { NomeTopo } from "../_components/Nome";
import NavLateral, { type ItemNav } from "../_components/NavLateral";
import Busca, { type EntradaBusca } from "../_components/Busca";
import Sino from "../_components/Sino";
import CriarMenu from "../_components/CriarMenu";
import TempoReal from "../_components/TempoReal";
import GuiaCelular from "../_components/GuiaCelular";
import MensagemUrl from "../_components/MensagemUrl";
import Toasts from "../_components/Toasts";
import { carregarCatalogo } from "@/lib/catalogo";
import { emailLogado, ehAdminParaMenu } from "@/lib/admin";
import { titulosParaBusca } from "@/lib/feed";
import { contarNaoLidas } from "@/lib/notificar";
import { carregarPainel, rotuloMenu } from "@/lib/paginas";
import { textoPuro } from "@/lib/doc";



const caminho = (slug: string) => (slug === "inicio" ? "/painel" : `/painel/${slug}`);

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const email = await emailLogado();
  const [admin, modulos, posts, naoLidas, { paginas }] = await Promise.all([
    ehAdminParaMenu(email),
    carregarCatalogo(),
    titulosParaBusca(),
    contarNaoLidas(email),
    carregarPainel(),
  ]);

  // O menu vem do banco: criar, renomear, reordenar ou apagar abas em Admin → Menu e páginas.
  const visiveis = paginas.filter((p) => (p.visivel || admin) && p.noMenu);
  const nav: ItemNav[] = visiveis.map((p) => ({
    href: caminho(p.slug),
    label: rotuloMenu(p) + (p.visivel ? "" : " (oculta)"),
    curto: rotuloMenu(p),
    icone: p.icone,
    ativoEm: p.slug === "inicio" ? "exato" : "prefixo",
  }));
  if (admin) nav.push({ href: "/painel/admin", label: "Admin", curto: "Admin", icone: "shield", ativoEm: "prefixo", soDesktop: true });

  // Busca: páginas, perguntas dos FAQs, cartões, ferramentas e postagens.
  const entradas: EntradaBusca[] = [
    ...posts.map((p) => ({ titulo: p.titulo, descricao: "", grupo: "Novidades", url: `/painel/novidades/${p.id}`, externo: false })),
    ...modulos.flatMap((m) => m.itens.map((it) => ({ titulo: it.titulo, descricao: it.descricao, grupo: m.titulo, url: it.url, externo: true }))),
  ];
  for (const p of paginas.filter((x) => x.visivel)) {
    const url = caminho(p.slug);
    entradas.push({ titulo: rotuloMenu(p), descricao: p.descricao ?? "", grupo: "Páginas", url, externo: false });
    for (const b of p.blocos.filter((x) => x.visivel)) {
      const d = b.dados;
      if (b.tipo === "faq" && Array.isArray(d.itens)) {
        for (const it of d.itens as { pergunta?: string; resposta?: string }[]) {
          if (it.pergunta) entradas.push({ titulo: it.pergunta, descricao: textoPuro(String(it.resposta ?? "")).slice(0, 120), grupo: p.titulo, url, externo: false });
        }
      } else if (b.tipo === "cartoes" && Array.isArray(d.itens)) {
        for (const it of d.itens as { titulo?: string; texto?: string; url?: string }[]) {
          if (!it.titulo) continue;
          const ext = !!it.url && !it.url.startsWith("/");
          entradas.push({ titulo: it.titulo, descricao: it.texto ?? "", grupo: p.titulo, url: it.url || url, externo: ext });
        }
      } else if (b.tipo === "secoes" && Array.isArray(d.secoes)) {
        for (const sec of d.secoes as { titulo?: string; itens?: { titulo?: string; texto?: string; url?: string }[] }[]) {
          for (const it of sec.itens ?? []) {
            if (!it.titulo) continue;
            const ext = !!it.url && !it.url.startsWith("/");
            entradas.push({ titulo: it.titulo, descricao: it.texto ?? "", grupo: sec.titulo || p.titulo, url: it.url || url, externo: ext });
          }
        }
      } else if (b.tipo === "corrida" && d.titulo) {
        entradas.push({ titulo: String(d.titulo), descricao: String(d.texto ?? ""), grupo: p.titulo, url, externo: false });
      }
    }
  }

  return (
    <div className="app">
      <BarraProgresso />
      <aside className="side">
        <Link className="brand" href="/painel" aria-label="Painel Dominion Mentory">
          <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
        </Link>
        <NavLateral itens={nav} />
        <div className="side-foot hide-m">
          <NomeTopo />
          <form action={sair}>
            <button className="btn sm" type="submit">Sair</button>
          </form>
        </div>
      </aside>

      <div className="col">
        <header className="topbar">
          <Link className="brand-m" href="/painel" aria-label="Painel">
            <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
          </Link>
          <Busca entradas={entradas} />
          <Sino naoLidas={naoLidas} vapid={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
          {admin && <CriarMenu />}
          <form action={sair} className="sair-m">
            <button className="btn sm" type="submit">Sair</button>
          </form>
        </header>
        {children}
      </div>
      <Toasts />
      <GuiaCelular vapid={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
      <TempoReal url={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null} chave={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null} />
      <Suspense fallback={null}>
        <MensagemUrl />
      </Suspense>
    </div>
  );
}
