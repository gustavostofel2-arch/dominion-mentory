"use client";

import { useCallback, useEffect, useState } from "react";
import AtivarPush, { type Estado } from "./AtivarPush";
import { definirSom, liberarAudio, somLigado, tocarSom } from "@/lib/som";

const CHAVE = "dm_guia";
const ADIAR_DIAS = 3;

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function ler(): string | null {
  try {
    return localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}
function gravar(v: string) {
  try {
    localStorage.setItem(CHAVE, v);
  } catch {
    // sem armazenamento: o guia pode aparecer de novo, sem problema
  }
}

function ambiente() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  const android = /Android/i.test(ua);
  const celular = ios || android || /Mobile/i.test(ua);
  const instalado = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  // navegador de dentro do TikTok/Instagram/Facebook: não deixa instalar nem ativar notificações
  const embutido = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|BytedanceWebview|Line\/|Snapchat/i.test(ua);
  return { ios, android, celular, instalado, embutido };
}

const IconeCompartilhar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ic-inline">
    <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
  </svg>
);
const IconeMais = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="ic-inline">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

/**
 * Guia que aparece no celular para a pessoa: (1) adicionar o app à tela de início,
 * (2) ativar as notificações e (3) conhecer o som da Dominion. Pode ser reaberto pelo sino.
 */
export default function GuiaCelular({ vapid }: { vapid: string | null }) {
  const [aberto, setAberto] = useState(false);
  const [env, setEnv] = useState<ReturnType<typeof ambiente> | null>(null);
  const [push, setPush] = useState<Estado>("carregando");
  const [som, setSom] = useState(true);
  const [ouviu, setOuviu] = useState(false);
  const [instalador, setInstalador] = useState<BeforeInstall | null>(null);

  const fechar = useCallback((definitivo: boolean) => {
    setAberto(false);
    if (!definitivo && ler() === "ok") return; // quem já concluiu não volta a ser incomodado
    gravar(definitivo ? "ok" : `adiar:${Date.now() + ADIAR_DIAS * 864e5}`);
  }, []);

  useEffect(() => {
    const e = ambiente();
    setEnv(e);
    setSom(somLigado());

    const capturar = (ev: Event) => {
      ev.preventDefault();
      setInstalador(ev as BeforeInstall);
    };
    const abrirPeloSino = () => setAberto(true);
    const instalou = () => setEnv(ambiente());
    window.addEventListener("beforeinstallprompt", capturar);
    window.addEventListener("appinstalled", instalou);
    window.addEventListener("dm:abrir-guia", abrirPeloSino);

    // abre sozinho só no celular, uma vez (e de novo depois de adiar)
    let timer: ReturnType<typeof setTimeout> | undefined;
    (async () => {
      if (!e.celular) return;
      const salvo = ler();
      if (salvo === "ok") return;
      if (salvo?.startsWith("adiar:") && Date.now() < Number(salvo.slice(6))) return;
      // quem já ativou as notificações neste aparelho não precisa ver o guia
      try {
        if ("serviceWorker" in navigator && "Notification" in window) {
          const reg = await navigator.serviceWorker.getRegistration("/sw.js");
          const sub = await reg?.pushManager.getSubscription();
          if (sub && Notification.permission === "granted") {
            gravar("ok");
            return;
          }
        }
      } catch {
        // segue e mostra o guia
      }
      timer = setTimeout(() => setAberto(true), 1500);
    })();

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", capturar);
      window.removeEventListener("appinstalled", instalou);
      window.removeEventListener("dm:abrir-guia", abrirPeloSino);
    };
  }, []);

  useEffect(() => {
    if (!aberto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar(false);
    document.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", esc);
    };
  }, [aberto, fechar]);

  if (!aberto || !env) return null;

  const instalado = env.instalado;
  const iosPrecisaInstalar = env.ios && !instalado;
  const passo2ok = push === "ativo";

  async function instalar() {
    if (!instalador) return;
    await instalador.prompt();
    await instalador.userChoice.catch(() => undefined);
    setInstalador(null);
    setEnv(ambiente());
  }

  return (
    <div className="modal-fundo" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && fechar(false)}>
      <div className="modal guia" role="dialog" aria-modal="true" aria-label="Como ativar as notificações">
        <header className="modal-topo">
          <b>Deixe o app do seu jeito 📲</b>
          <button type="button" className="x" aria-label="Fechar" onClick={() => fechar(false)}>×</button>
        </header>
        <div className="modal-corpo">
          <p className="dica" style={{ marginBottom: 14 }}>
            3 passos rápidos para não perder calls, avisos e novidades da comunidade. Leva menos de 1 minuto.
          </p>

          {env.embutido && (
            <div className="nota">
              Você abriu pelo navegador de dentro de outro app (TikTok, Instagram…). Para instalar e receber notificações,
              toque nos <b>três pontinhos</b> e escolha <b>“Abrir no navegador”</b> ({env.ios ? "Safari" : "Chrome"}).
            </div>
          )}

          {/* PASSO 1 */}
          <section className={`passo${instalado ? " ok" : ""}`}>
            <span className="passo-n">{instalado ? "✓" : "1"}</span>
            <div className="passo-c">
              <h3>Adicione à tela de início</h3>
              {instalado ? (
                <p>Pronto! Você já está usando o app instalado.</p>
              ) : env.ios ? (
                <ol>
                  <li>Abra este site no <b>Safari</b>.</li>
                  <li>Toque em <b>Compartilhar</b> <IconeCompartilhar /> (o quadrado com a seta, embaixo da tela).</li>
                  <li>Role e toque em <b>Adicionar à Tela de Início</b> <IconeMais />.</li>
                  <li>Toque em <b>Adicionar</b> e, daqui para frente, abra o <b>Dominion</b> pelo ícone novo.</li>
                </ol>
              ) : instalador ? (
                <>
                  <p>Um toque e o app fica na sua tela, como qualquer outro.</p>
                  <button type="button" className="btn primary sm" onClick={instalar}>Instalar agora</button>
                </>
              ) : (
                <ol>
                  <li>No Chrome, toque nos <b>três pontinhos ⋮</b> (canto de cima).</li>
                  <li>Escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b>).</li>
                  <li>Confirme e abra o <b>Dominion</b> pelo ícone novo.</li>
                </ol>
              )}
            </div>
          </section>

          {/* PASSO 2 */}
          <section className={`passo${passo2ok ? " ok" : ""}`}>
            <span className="passo-n">{passo2ok ? "✓" : "2"}</span>
            <div className="passo-c">
              <h3>Ative as notificações</h3>
              {!vapid ? (
                <p>As notificações no celular serão liberadas em breve.</p>
              ) : iosPrecisaInstalar ? (
                <p>No iPhone, as notificações só funcionam depois do passo 1. Abra o app pelo ícone novo e este guia volta para você ativar.</p>
              ) : (
                <>
                  <p>Toque em <b>Ativar</b> e, quando o celular perguntar, escolha <b>Permitir</b>.</p>
                  <AtivarPush vapid={vapid} compacto aoMudarEstado={setPush} />
                </>
              )}
            </div>
          </section>

          {/* PASSO 3 */}
          <section className={`passo${ouviu ? " ok" : ""}`}>
            <span className="passo-n">{ouviu ? "✓" : "3"}</span>
            <div className="passo-c">
              <h3>Conheça o som da Dominion</h3>
              <p>
                Com o app aberto, cada novidade toca o nosso “pika”. Com o app fechado, o som é o padrão do celular
                (dá para trocar em <b>Configurações → Notificações → Dominion</b>).
              </p>
              <div className="acts" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={() => {
                    liberarAudio();
                    tocarSom(true);
                    setOuviu(true);
                  }}
                >
                  ▶ Ouvir o som
                </button>
                <label className="chk">
                  <input
                    type="checkbox"
                    checked={som}
                    onChange={(e) => {
                      setSom(e.target.checked);
                      definirSom(e.target.checked);
                    }}
                  />
                  Tocar o som no app
                </label>
              </div>
            </div>
          </section>

          <div className="modal-rodape">
            <button type="button" className="btn" onClick={() => fechar(false)}>Agora não</button>
            <button type="button" className="btn primary" onClick={() => fechar(true)}>Pronto, concluir</button>
          </div>
        </div>
      </div>
    </div>
  );
}
