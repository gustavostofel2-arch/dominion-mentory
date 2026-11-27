import Link from "next/link";
import type { ReactNode } from "react";
import type { Bloco } from "@/lib/paginas";
import type { Dados } from "@/lib/blocos";
import { renderConteudo } from "@/lib/doc";
import { carregarAvisos, carregarCatalogo } from "@/lib/catalogo";
import { listarPosts } from "@/lib/feed";
import { modoFeed } from "@/lib/blocos";
import { SaudacaoBloco } from "../Nome";
import { Icone } from "../Icone";
import AvisosCarrossel from "../AvisosCarrossel";
import GradeFerramentas from "../GradeFerramentas";
import PostCard from "../PostCard";
import NovaPostagem from "../NovaPostagem";
import Corrida from "./Corrida";

export type Ctx = { email: string | null; admin: boolean; slug?: string };

const s = (v: unknown) => (typeof v === "string" ? v : "");
const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);

/** Link interno (mesma aba) ou externo (nova aba). */
function Lnk({ url, className, children }: { url: string; className?: string; children: ReactNode }) {
  if (!url) return <span className={className}>{children}</span>;
  if (url.startsWith("/")) return <Link className={className} href={url}>{children}</Link>;
  return <a className={className} href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
}

const CORES = ["azul", "laranja", "verde", "roxo", "vermelho"];
/** Classe de cor do cartão ("" = neutra). */
const corDe = (c?: string) => (c && CORES.includes(c) ? ` cor-${c}` : "");

function Titulo({ titulo, ver }: { titulo: string; ver?: { texto: string; url: string } }) {
  if (!titulo && !ver?.texto) return null;
  return (
    <div className="sec-titulo">
      <h2>{titulo}</h2>
      {ver?.texto && ver.url ? <Lnk url={ver.url}>{ver.texto}</Lnk> : null}
    </div>
  );
}

export default async function ConteudoBloco({ bloco, ctx }: { bloco: Bloco; ctx: Ctx }): Promise<ReactNode> {
  const d: Dados = bloco.dados;

  switch (bloco.tipo) {
    case "saudacao":
      return (
        <div className="wrap pg-head">
          <SaudacaoBloco etiqueta={s(d.etiqueta)} titulo={s(d.titulo)} texto={s(d.texto)} />
        </div>
      );

    case "titulo":
      return (
        <section className="bloco">
          <div className={`wrap bl-titulo${d.alinhamento === "centro" ? " centro" : ""}`}>
            <h2>{s(d.texto)}</h2>
            {d.subtitulo ? <p>{s(d.subtitulo)}</p> : null}
          </div>
        </section>
      );

    case "texto": {
      const corpo = s(d.corpo);
      if (!corpo) return ctx.admin ? <BlocoVazio nome="Texto" /> : null;
      const estilo = s(d.estilo) || "normal";
      return (
        <section className="bloco">
          <div className="wrap">
            <div className={`bl-texto ${estilo}`}>
              <div className="ptexto">{renderConteudo(corpo)}</div>
            </div>
          </div>
        </section>
      );
    }

    case "imagem": {
      const url = s(d.imagem);
      if (!url) return ctx.admin ? <BlocoVazio nome="Imagem" /> : null;
      const figura = (
        <figure className={`bl-imagem ${d.largura === "media" ? "media" : ""}`}>
          <img src={url} alt={s(d.legenda)} loading="lazy" decoding="async" />
          {d.legenda ? <figcaption>{s(d.legenda)}</figcaption> : null}
        </figure>
      );
      return (
        <section className="bloco">
          <div className="wrap">{d.link ? <Lnk url={s(d.link)}>{figura}</Lnk> : figura}</div>
        </section>
      );
    }

    case "imagem_texto": {
      const url = s(d.imagem);
      const pos = s(d.posicao) || "esquerda";
      const corpo = s(d.corpo);
      const texto = (
        <div className="it-tx">
          {d.titulo ? <h2>{s(d.titulo)}</h2> : null}
          {corpo ? <div className="ptexto">{renderConteudo(corpo)}</div> : null}
          {d.botao_texto && d.botao_url ? <Lnk url={s(d.botao_url)} className="btn primary">{s(d.botao_texto)}</Lnk> : null}
        </div>
      );
      if (!url && !corpo && !d.titulo) return ctx.admin ? <BlocoVazio nome="Imagem com texto" /> : null;
      return (
        <section className="bloco">
          <div className="wrap">
            {pos === "fundo" ? (
              <div className="it it-fundo" style={url ? { backgroundImage: `url(${url})` } : undefined}>
                <div className="it-veu">{texto}</div>
              </div>
            ) : (
              <div className={`it it-${pos}`}>
                {url ? <img className="it-img" src={url} alt="" loading="lazy" decoding="async" /> : null}
                {texto}
              </div>
            )}
          </div>
        </section>
      );
    }

    case "faq": {
      const itens = arr<{ pergunta: string; resposta: string; selo: string }>(d.itens);
      if (!itens.length) return ctx.admin ? <BlocoVazio nome="Perguntas e respostas" /> : null;
      return (
        <section className="bloco">
          <div className="wrap">
            <Titulo titulo={s(d.titulo)} />
            <div className="rules">
              {itens.map((it, i) => (
                <details className={`rule${it.selo ? " hard" : ""}`} key={i}>
                  <summary>
                    {d.numerar ? <span className="n">{i + 1}</span> : null}
                    <span className="tt">{it.pergunta}</span>
                    {it.selo ? <span className="tag">{it.selo}</span> : null}
                    <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <div className={`body${d.numerar ? "" : " sem-n"}`}>{it.resposta ? renderConteudo(it.resposta) : null}</div>
                </details>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "cartoes": {
      const itens = arr<{ icone: string; etiqueta: string; titulo: string; texto: string; url: string; botao: string; cor?: string }>(d.itens);
      if (!itens.length) return ctx.admin ? <BlocoVazio nome="Cartões" /> : null;
      const colunas = ["1", "2", "3"].includes(s(d.colunas)) ? s(d.colunas) : "3";
      const destaque = d.estilo === "destaque";
      return (
        <section className="bloco">
          <div className="wrap">
            <Titulo titulo={s(d.titulo)} />
            <div className={`cartoes c${colunas}${destaque ? " destaque" : ""}`}>
              {itens.map((it, i) =>
                destaque ? (
                  <div className={`flow${corDe(it.cor)}`} key={i}>
                    <div style={{ position: "relative", zIndex: 1 }}>
                      {it.etiqueta ? <span className="tag">{it.etiqueta}</span> : null}
                      <h2>{it.titulo}</h2>
                      {it.texto ? <p>{it.texto}</p> : null}
                    </div>
                    {it.url ? (
                      <Lnk url={it.url} className="btn primary">{it.botao || "Abrir"}</Lnk>
                    ) : null}
                  </div>
                ) : (
                  <Lnk url={it.url} className={`tool${it.url ? "" : " sem-link"}${corDe(it.cor)}`} key={i}>
                    <span className="ic"><Icone nome={it.icone} /></span>
                    <h4>{it.titulo}</h4>
                    {it.texto ? <p>{it.texto}</p> : null}
                    <div className="row">
                      {it.etiqueta ? <span className="chip op">{it.etiqueta}</span> : <span />}
                      {it.url ? <span className="open">{(it.botao || "abrir").toLowerCase()} →</span> : null}
                    </div>
                  </Lnk>
                ),
              )}
            </div>
          </div>
        </section>
      );
    }

    case "secoes": {
      const secoes = arr<{ titulo: string; itens: { icone: string; cor?: string; etiqueta: string; titulo: string; texto: string; url: string; botao: string }[] }>(d.secoes).filter((x) => arr(x.itens).length);
      if (!secoes.length) return ctx.admin ? <BlocoVazio nome="Seções de cartões" /> : null;
      const colunas = ["2", "3", "4"].includes(s(d.colunas)) ? s(d.colunas) : "3";
      return (
        <section className="bloco">
          <div className="wrap">
            <Titulo titulo={s(d.titulo)} />
            {secoes.map((sec, k) => (
              <div className="group" key={k}>
                {sec.titulo ? <h3>{sec.titulo}</h3> : null}
                <div className={`grid sec-c${colunas}`}>
                  {arr<(typeof sec.itens)[number]>(sec.itens).map((it, i) => (
                    <Lnk url={it.url} className={`tool${it.url ? "" : " sem-link"}${corDe(it.cor)}`} key={i}>
                      <span className="ic"><Icone nome={it.icone} /></span>
                      <h4>{it.titulo}</h4>
                      {it.texto ? <p>{it.texto}</p> : null}
                      <div className="row">
                        {it.etiqueta ? <span className="chip op">{it.etiqueta}</span> : <span />}
                        {it.url ? <span className="open">{(it.botao || "abrir").toLowerCase()} →</span> : null}
                      </div>
                    </Lnk>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "botoes": {
      const itens = arr<{ texto: string; url: string; estilo: string }>(d.itens).filter((i) => i.texto && i.url);
      if (!itens.length) return ctx.admin ? <BlocoVazio nome="Botões" /> : null;
      return (
        <section className="bloco">
          <div className={`wrap bl-botoes${d.alinhamento === "centro" ? " centro" : ""}`}>
            {itens.map((it, i) => (
              <Lnk key={i} url={it.url} className={`btn${it.estilo === "secundario" ? "" : " primary"}`}>{it.texto}</Lnk>
            ))}
          </div>
        </section>
      );
    }

    case "ferramentas": {
      const modulos = await carregarCatalogo();
      const alvo = s(d.modulo);
      const escolhidos = alvo && alvo !== "todos" ? modulos.filter((m) => m.id === alvo) : modulos;
      const mostrar = s(d.mostrar) || "tudo";
      const destaques = mostrar === "modulos" ? [] : escolhidos.flatMap((m) => m.itens.filter((i) => i.destaque));
      const mods = mostrar === "destaques" ? [] : escolhidos;
      if (!destaques.length && !mods.some((m) => m.itens.some((i) => !i.destaque))) return ctx.admin ? <BlocoVazio nome="Ferramentas" /> : null;
      return (
        <section className="bloco">
          <div className="wrap">
            <Titulo titulo={s(d.titulo)} ver={ctx.slug && ctx.slug !== "ferramentas" ? { texto: "Ver todas as ferramentas →", url: "/painel/ferramentas" } : undefined} />
            {destaques.map((x) => (
              <a className="start" href={x.url} target="_blank" rel="noopener noreferrer" key={x.id} style={{ marginBottom: 14 }}>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <span className="chip aula">{x.tag || "Comece aqui"}</span>
                  <h3>{x.titulo}</h3>
                  <p>{x.descricao}</p>
                </div>
                <span className="btn primary go">Abrir</span>
              </a>
            ))}
            {mods.length > 0 && (
              <div style={{ marginTop: destaques.length ? 26 : 0 }}>
                <GradeFerramentas modulos={mods} />
              </div>
            )}
          </div>
        </section>
      );
    }

    case "feed": {
      const slug = ctx.slug ?? "";
      const modo = modoFeed(d);
      const posts = await listarPosts({
        email: ctx.email,
        limite: 100,
        soFixados: modo === "destacadas",
        pagina: modo === "pagina" && slug ? slug : undefined,
        comNovidades: slug === "novidades",
      });
      const podePostar = ctx.admin && modo === "pagina";
      return (
        <section className="bloco">
          <div className="wrap">
            <Titulo titulo={s(d.titulo)} />
            {podePostar && (
              <div style={{ marginBottom: 18 }}>
                <NovaPostagem destino={slug} />
              </div>
            )}
            {posts.length === 0 ? (
              <div className="vazio-card">
                <b>{modo === "destacadas" ? "Nenhuma postagem em destaque." : "Ainda não há postagens."}</b>
                <p>
                  {modo === "destacadas"
                    ? ctx.admin
                      ? "Abra o ⋯ de uma postagem e escolha “Destacar no Início”."
                      : "Em breve a equipe destaca algo por aqui."
                    : "Assim que a equipe publicar uma novidade, ela aparece aqui."}
                </p>
                {podePostar && <NovaPostagem rotulo="Criar a primeira postagem" destino={slug} />}
              </div>
            ) : (
              <div className="feed">
                {posts.map((p) => <PostCard key={p.id} post={p} admin={ctx.admin} />)}
              </div>
            )}
          </div>
        </section>
      );
    }

    case "avisos": {
      const avisos = await carregarAvisos();
      if (!avisos.length) return ctx.admin ? <BlocoVazio nome="Avisos (nenhum aviso no ar agora)" /> : null;
      return <AvisosCarrossel avisos={avisos} />;
    }

    case "corrida":
      return <Corrida d={d} uid={bloco.id.slice(0, 8)} />;

    case "separador":
      return d.estilo === "espaco" ? <div className="bl-espaco" aria-hidden="true" /> : <div className="wrap"><hr className="bl-linha" /></div>;

    default:
      return null;
  }
}

/** Aviso discreto só para admins: o bloco existe mas ainda não tem conteúdo. */
function BlocoVazio({ nome }: { nome: string }) {
  return (
    <div className="wrap">
      <div className="bl-vazio">Bloco “{nome}” sem conteúdo. Use “Editar página” para preencher.</div>
    </div>
  );
}
