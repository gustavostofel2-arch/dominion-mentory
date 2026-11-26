import Cabecalho from "../../_components/Cabecalho";
import RaceCompleta from "../../_components/RaceCompleta";
import Rodape from "../../_components/Rodape";

export const metadata = { title: "Dominion Race | Dominion Mentory", robots: { index: false } };

export default function Race() {
  return (
    <>
      <main>
        <Cabecalho etiqueta="Competição da Turma 1" titulo="Dominion Race" texto="Pódio de faturamento e Dominion MVP. Datas, premiação e regulamento completo." />
        <div className="wrap">
          <RaceCompleta />
        </div>
      </main>
      <Rodape />
    </>
  );
}
