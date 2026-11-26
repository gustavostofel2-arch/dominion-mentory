import type { Modulo } from "@/lib/catalogo";
import { Icone } from "./Icone";

export default function GradeFerramentas({ modulos }: { modulos: Modulo[] }) {
  const grupos = modulos
    .map((m) => ({ ...m, itens: m.itens.filter((i) => !i.destaque) }))
    .filter((m) => m.itens.length > 0);
  return (
    <>
      {grupos.map((g) => (
        <div className="group" key={g.id}>
          <h3>{g.titulo}</h3>
          <div className="grid">
            {g.itens.map((it) => (
              <a className="tool" href={it.url} target="_blank" rel="noopener noreferrer" key={it.id}>
                <span className="ic"><Icone nome={it.icone} /></span>
                <h4>{it.titulo}</h4>
                <p>{it.descricao}</p>
                <div className="row">
                  {it.tag ? <span className={`chip ${g.cor}`}>{it.tag}</span> : <span />}
                  <span className="open">abrir →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
