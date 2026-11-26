"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Aviso } from "@/lib/catalogo";
import { Icone } from "./Icone";

const ROTULO = { info: "Aviso", importante: "Importante", urgente: "Urgente" } as const;
const INTERVALO = 5000;

function Cartao({ a }: { a: Aviso }) {
  const interno = !!a.linkUrl && a.linkUrl.startsWith("/");
  const conteudo = (
    <>
      {a.imagemUrl && <img className="aviso-img" src={a.imagemUrl} alt="" style={{ aspectRatio: "16 / 9" }} decoding="async" />}
      <div className="aviso-corpo">
        <span className="ic"><Icone nome="megaphone" /></span>
        <div className="tx">
          <span className="rot">{ROTULO[a.tipo]}</span>
          <h2>{a.titulo}</h2>
          {a.texto && <p>{a.texto}</p>}
        </div>
        {a.linkUrl && <span className="btn primary">{a.linkTexto || "Abrir"}</span>}
      </div>
    </>
  );
  const classe = `aviso ${a.tipo}${a.imagemUrl ? " com-img" : ""}`;
  if (!a.linkUrl) return <article className={classe}>{conteudo}</article>;
  return interno ? (
    <Link className={`${classe} clicavel`} href={a.linkUrl}>{conteudo}</Link>
  ) : (
    <a className={`${classe} clicavel`} href={a.linkUrl} target="_blank" rel="noopener noreferrer">{conteudo}</a>
  );
}

/** Avisos do Início: passam sozinhos de 5 em 5 segundos, com bolinhas, setas e deslize no celular. */
export default function AvisosCarrossel({ avisos }: { avisos: Aviso[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const pausado = useRef(false);
  const n = avisos.length;

  const ir = useCallback(
    (alvo: number) => {
      const el = trilho.current;
      if (!el || n < 1) return;
      const k = ((alvo % n) + n) % n;
      el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" });
      setI(k);
    },
    [n],
  );

  // avança sozinho
  useEffect(() => {
    if (n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (!pausado.current && !document.hidden) ir(i + 1);
    }, INTERVALO);
    return () => clearInterval(id);
  }, [i, n, ir]);

  // acompanha o deslize feito com o dedo
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => setI(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))), 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  if (!n) return null;

  return (
    <section
      className="carrossel"
      aria-roledescription="carrossel"
      aria-label="Avisos"
      onMouseEnter={() => (pausado.current = true)}
      onMouseLeave={() => (pausado.current = false)}
      onFocusCapture={() => (pausado.current = true)}
      onBlurCapture={() => (pausado.current = false)}
      onTouchStart={() => (pausado.current = true)}
      onTouchEnd={() => setTimeout(() => (pausado.current = false), 6000)}
    >
      <div className="car-trilho" ref={trilho}>
        {avisos.map((a, k) => (
          <div className="car-slide" key={a.id} role="group" aria-roledescription="aviso" aria-label={`${k + 1} de ${n}`}>
            <Cartao a={a} />
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="car-ctl">
          <button type="button" className="car-seta" aria-label="Aviso anterior" onClick={() => ir(i - 1)}>‹</button>
          <div className="car-dots">
            {avisos.map((a, k) => (
              <button
                type="button"
                key={a.id}
                className={k === i ? "on" : undefined}
                aria-label={`Ir para o aviso ${k + 1}`}
                aria-current={k === i}
                onClick={() => ir(k)}
              />
            ))}
          </div>
          <button type="button" className="car-seta" aria-label="Próximo aviso" onClick={() => ir(i + 1)}>›</button>
        </div>
      )}
    </section>
  );
}
