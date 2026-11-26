import Link from "next/link";
import Countdown from "../Countdown";
import type { Dados } from "@/lib/blocos";

const dia = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }) : "";
const diaMes = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }) : "";

type Premio = { posicao: string; valor: string; legenda: string };

function Coroa({ id }: { id: string }) {
  return (
    <svg className="crown" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe29a" />
          <stop offset=".5" stopColor="#ffb020" />
          <stop offset="1" stopColor="#ff7a1a" />
        </linearGradient>
      </defs>
      <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill={`url(#${id})`} />
      <rect x="8" y="49" width="48" height="7" rx="2" fill={`url(#${id})`} />
      <circle cx="3" cy="18" r="3" fill="#ffe29a" />
      <circle cx="32" cy="10" r="3.4" fill="#ffe29a" />
      <circle cx="61" cy="18" r="3" fill="#ffe29a" />
    </svg>
  );
}

/** Bloco "Corrida": contagem, datas e pódio. Tudo vem dos campos editados no Admin. */
export default function Corrida({ d, uid }: { d: Dados; uid: string }) {
  const inicio = String(d.inicio ?? "");
  const fim = String(d.fim ?? "");
  const prazo = String(d.prazo ?? "");
  const contagem = d.contagem !== false && !!inicio && !!fim;
  const premios = (Array.isArray(d.premios) ? d.premios : []) as Premio[];
  const idCoroa = `cg-${uid}`;

  if (d.variante === "resumo") {
    const link = String(d.link_url ?? "");
    const miolo = (
      <>
        <Coroa id={idCoroa} />
        <div>
          {d.etiqueta ? <span className="eyebrow">{String(d.etiqueta)}</span> : null}
          <h2>{String(d.titulo ?? "")}</h2>
          {d.texto ? <p style={{ color: "var(--muted)", fontSize: ".9rem" }}>{String(d.texto)}</p> : null}
          {contagem && <Countdown inicio={inicio} fim={fim} prazo={prazo} completo />}
        </div>
        {link && d.link_texto ? <span className="btn primary">{String(d.link_texto)}</span> : null}
      </>
    );
    return (
      <section className="bloco">
        <div className="wrap">
          {link ? (
            link.startsWith("/") ? <Link className="race-mini" href={link}>{miolo}</Link> : <a className="race-mini" href={link} target="_blank" rel="noopener noreferrer">{miolo}</a>
          ) : (
            <div className="race-mini">{miolo}</div>
          )}
        </div>
      </section>
    );
  }

  const [p1, p2, p3] = [premios[0], premios[1], premios[2]];
  return (
    <section className="bloco">
      <div className="wrap">
        <div className="race">
          <div className="top">
            <Coroa id={idCoroa} />
            {d.etiqueta ? <span className="eyebrow">{String(d.etiqueta)}</span> : null}
            <h2>{String(d.titulo ?? "")}</h2>
            {d.texto ? <p>{String(d.texto)}</p> : null}
          </div>

          {(inicio || fim || prazo) && (
            <div className="dates">
              {inicio && <div className="date"><small>Início</small><b>{dia(inicio)}</b></div>}
              {fim && <div className="date"><small>Encerramento</small><b>{dia(fim)}</b></div>}
              {prazo && <div className="date hot"><small>{String(d.prazo_rotulo || "Prazo")}</small><b>{diaMes(prazo)}</b></div>}
            </div>
          )}
          {contagem && <Countdown inicio={inicio} fim={fim} prazo={prazo} completo />}

          {premios.length > 0 && (
            <div className="podium" role="img" aria-label={`Pódio: ${premios.map((p) => `${p.posicao} lugar ${p.valor}`).join(", ")}`}>
              {p2 && <div className="step p2"><span className="medal">{p2.posicao}</span><span className="pix">{p2.valor}</span><small>{p2.legenda}</small></div>}
              {p1 && (
                <div className="step p1">
                  <svg className="mini-crown" viewBox="0 0 64 64" aria-hidden="true">
                    <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill={`url(#${idCoroa})`} />
                    <rect x="8" y="49" width="48" height="7" rx="2" fill={`url(#${idCoroa})`} />
                  </svg>
                  <span className="medal">{p1.posicao}</span><span className="pix">{p1.valor}</span><small>{p1.legenda}</small>
                </div>
              )}
              {p3 && <div className="step p3"><span className="medal">{p3.posicao}</span><span className="pix">{p3.valor}</span><small>{p3.legenda}</small></div>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
