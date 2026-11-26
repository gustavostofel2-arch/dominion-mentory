import Cabecalho from "../../_components/Cabecalho";
import GradeFerramentas from "../../_components/GradeFerramentas";
import Rodape from "../../_components/Rodape";
import { carregarCatalogo } from "@/lib/catalogo";

export const metadata = { title: "Ferramentas | Dominion Mentory", robots: { index: false } };

export default async function Ferramentas() {
  const modulos = await carregarCatalogo();
  const destaques = modulos.flatMap((m) => m.itens.filter((i) => i.destaque));
  return (
    <>
      <main>
        <Cabecalho
          etiqueta="Ferramentas e aulas"
          titulo="Escolha o sistema e abra"
          texto="Cada ferramenta abre em uma nova aba. Para voltar, é só fechar a aba e você continua aqui no painel. Use a busca no topo para achar mais rápido."
        />
        <div className="wrap">
          {destaques.map((d) => (
            <a className="start" href={d.url} target="_blank" rel="noopener noreferrer" key={d.id} style={{ marginBottom: 26 }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <span className="chip aula">{d.tag || "Comece aqui"}</span>
                <h3>{d.titulo}</h3>
                <p>{d.descricao}</p>
              </div>
              <span className="btn primary go">Abrir</span>
            </a>
          ))}
          <GradeFerramentas modulos={modulos} />
        </div>
      </main>
      <Rodape />
    </>
  );
}
