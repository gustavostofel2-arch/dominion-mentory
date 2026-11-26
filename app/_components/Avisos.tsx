import type { Aviso } from "@/lib/catalogo";
import { Icone } from "./Icone";

const ROTULO = { info: "Aviso", importante: "Importante", urgente: "Urgente" } as const;

/** Faixa de avisos: sempre no topo do Início e das Novidades. */
export default function Avisos({ avisos }: { avisos: Aviso[] }) {
  if (!avisos.length) return null;
  return (
    <section className="avisos" aria-label="Avisos">
      {avisos.map((a) => (
        <article className={`aviso ${a.tipo}${a.imagemUrl ? " com-img" : ""}`} key={a.id} role={a.tipo === "urgente" ? "alert" : undefined}>
          {a.imagemUrl && <img className="aviso-img" src={a.imagemUrl} alt="" style={{ aspectRatio: "16 / 9" }} />}
          <div className="aviso-corpo">
            <span className="ic">
              <Icone nome="megaphone" />
            </span>
            <div className="tx">
              <span className="rot">{ROTULO[a.tipo]}</span>
              <h2>{a.titulo}</h2>
              {a.texto && <p>{a.texto}</p>}
            </div>
            {a.linkUrl && (
              <a className="btn primary" href={a.linkUrl} target="_blank" rel="noopener noreferrer">
                {a.linkTexto || "Abrir"}
              </a>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
