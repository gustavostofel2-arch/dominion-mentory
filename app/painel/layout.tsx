import "./painel.css";
import "./comunidade.css";
import { sair } from "../login/actions";
import { NomeTopo } from "../_components/Nome";
import NavLateral, { type ItemNav } from "../_components/NavLateral";
import Busca, { type EntradaBusca } from "../_components/Busca";
import { Icone } from "../_components/Icone";
import { carregarCatalogo } from "@/lib/catalogo";
import { emailLogado, ehAdminParaMenu } from "@/lib/admin";
import { titulosParaBusca } from "@/lib/feed";
import { FLOW_URL, REGRAS, REGRAS_PLATAFORMA, TURBO_FLOW_URL } from "@/lib/conteudo";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const email = await emailLogado();
  const [admin, modulos, posts] = await Promise.all([ehAdminParaMenu(email), carregarCatalogo(), titulosParaBusca()]);

  // Cada item é uma página própria (não rola a tela).
  const nav: ItemNav[] = [
    { href: "/painel", label: "Início", curto: "Início", icone: "home", ativoEm: "exato" },
    { href: "/painel/novidades", label: "Novidades", curto: "Novidades", icone: "megaphone", ativoEm: "prefixo" },
    { href: "/painel/ferramentas", label: "Ferramentas e aulas", curto: "Ferramentas", icone: "grid", ativoEm: "prefixo" },
    { href: "/painel/flow", label: "Dominion Flow", curto: "Flow", icone: "bolt", ativoEm: "prefixo" },
    { href: "/painel/race", label: "Dominion Race", curto: "Race", icone: "trophy", ativoEm: "prefixo" },
    { href: "/painel/regras", label: "Regras", curto: "Regras", icone: "book", ativoEm: "prefixo" },
  ];
  if (admin) nav.push({ href: "/painel/admin", label: "Admin", curto: "Admin", icone: "shield", ativoEm: "prefixo", soDesktop: true });

  const entradas: EntradaBusca[] = [
    ...posts.map((p) => ({ titulo: p.titulo, descricao: "", grupo: "Novidades", url: `/painel/novidades/${p.id}`, externo: false })),
    ...modulos.flatMap((m) =>
      m.itens.map((it) => ({ titulo: it.titulo, descricao: it.descricao, grupo: m.titulo, url: it.url, externo: true })),
    ),
    { titulo: "Dominion Flow", descricao: "Workflows dentro do Google Flow", grupo: "Dominion Flow", url: FLOW_URL, externo: true },
    { titulo: "Modo de uso do Flow Turbo", descricao: "Como usar o Flow Turbo", grupo: "Dominion Flow", url: TURBO_FLOW_URL, externo: true },
    { titulo: "Dominion Race", descricao: "Corrida, pódio, datas e MVP", grupo: "Comunidade", url: "/painel/race", externo: false },
    { titulo: "Novidades", descricao: "Avisos e postagens da equipe", grupo: "Comunidade", url: "/painel/novidades", externo: false },
    ...[...REGRAS, ...REGRAS_PLATAFORMA].map((r) => ({
      titulo: r.titulo,
      descricao: "",
      grupo: "Regras",
      url: "/painel/regras",
      externo: false,
    })),
  ];

  return (
    <div className="app">
      <aside className="side">
        <a className="brand" href="/painel" aria-label="Painel Dominion Mentory">
          <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
        </a>
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
          <a className="brand-m" href="/painel" aria-label="Painel">
            <img className="lg" src="/img/logo.png" alt="Dominion Mentory" />
          </a>
          <Busca entradas={entradas} />
          {admin && (
            <a className="adm-m" href="/painel/admin" aria-label="Admin">
              <Icone nome="shield" />
            </a>
          )}
          <form action={sair} className="sair-m">
            <button className="btn sm" type="submit">Sair</button>
          </form>
        </header>
        {children}
      </div>
    </div>
  );
}
