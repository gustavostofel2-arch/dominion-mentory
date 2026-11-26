import "./painel.css";
import { sair } from "../login/actions";
import { NomeTopo } from "../_components/Nome";
import NavLateral, { type ItemNav } from "../_components/NavLateral";
import Busca, { type EntradaBusca } from "../_components/Busca";
import { carregarCatalogo } from "@/lib/catalogo";
import { emailLogado, ehAdminParaMenu } from "@/lib/admin";
import { FLOW_URL, REGRAS, TURBO_FLOW_URL } from "@/lib/conteudo";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const email = await emailLogado();
  const [admin, modulos] = await Promise.all([ehAdminParaMenu(email), carregarCatalogo()]);

  const nav: ItemNav[] = [
    { href: "/painel", label: "Início", curto: "Início", icone: "home", ativoEm: "exato" },
    { href: "/painel#ferramentas", label: "Ferramentas e aulas", curto: "Ferramentas", icone: "grid" },
    { href: "/painel#flow", label: "Dominion Flow", curto: "Flow", icone: "bolt" },
    { href: "/painel#race", label: "Dominion Race", curto: "Race", icone: "trophy" },
    { href: "/painel#regras", label: "Regras da mentoria", curto: "Regras", icone: "book" },
  ];
  if (admin) nav.push({ href: "/painel/admin", label: "Admin", curto: "Admin", icone: "shield", ativoEm: "prefixo" });

  const entradas: EntradaBusca[] = [
    ...modulos.flatMap((m) =>
      m.itens.map((it) => ({
        titulo: it.titulo,
        descricao: it.descricao,
        grupo: m.titulo,
        url: it.url,
        externo: true,
      })),
    ),
    { titulo: "Dominion Flow", descricao: "Workflows dentro do Google Flow", grupo: "Dominion Flow", url: FLOW_URL, externo: true },
    { titulo: "Modo de uso do Flow Turbo", descricao: "Como usar o Flow Turbo", grupo: "Dominion Flow", url: TURBO_FLOW_URL, externo: true },
    { titulo: "Dominion Race", descricao: "Corrida, pódio, datas e MVP", grupo: "Comunidade", url: "/painel#race", externo: false },
    ...REGRAS.map((r) => ({
      titulo: r.titulo,
      descricao: "",
      grupo: "Regras da mentoria",
      url: "/painel#regras",
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
          <form action={sair} className="sair-m">
            <button className="btn sm" type="submit">Sair</button>
          </form>
        </header>
        {children}
      </div>
    </div>
  );
}
