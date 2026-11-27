"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ALVO, carregar, recortar, recortarCentral, type Formato } from "@/lib/recorte";

/**
 * Imagem da postagem ou do aviso. Assim que a pessoa escolhe o arquivo, ele já é enquadrado no centro,
 * comprimido e anexado ao formulário (nada se perde se ela publicar direto). "Ajustar enquadramento" é opcional.
 */
export default function UploadImagem({
  atual,
  formatoAtual,
  formatoFixo,
}: {
  atual?: string | null;
  formatoAtual?: string | null;
  formatoFixo?: Formato;
}) {
  const [formato, setFormato] = useState<Formato>(formatoFixo ?? ((formatoAtual as Formato) || "quadrada"));
  const [fonte, setFonte] = useState<string | null>(null); // imagem original escolhida
  const [nome, setNome] = useState("");
  const [cortando, setCortando] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [giro, setGiro] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const alvoFile = useRef<HTMLInputElement>(null);
  const reenviando = useRef(false);

  const alvo = ALVO[formato];

  useEffect(
    () => () => {
      if (fonte) URL.revokeObjectURL(fonte);
    },
    [fonte],
  );

  /** Coloca o arquivo pronto no campo escondido (é ele que vai junto com o formulário). */
  const anexar = useCallback((arquivo: File) => {
    if (!alvoFile.current) return;
    const dt = new DataTransfer();
    dt.items.add(arquivo);
    alvoFile.current.files = dt.files;
    setPrevia((antes) => {
      if (antes) URL.revokeObjectURL(antes);
      return URL.createObjectURL(arquivo);
    });
  }, []);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErro("");
    if (!f.type.startsWith("image/") && !/\.(heic|heif|avif|bmp|gif|tiff?|svg)$/i.test(f.name)) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }
    const url = URL.createObjectURL(f);
    setOcupado(true);
    try {
      await carregar(url); // confere se o navegador abre esse formato
      anexar(await recortarCentral(url, alvo));
      setFonte(url);
      setNome(f.name);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setGiro(0);
      setCortando(false);
    } catch {
      URL.revokeObjectURL(url);
      setErro("Este navegador não consegue abrir esse formato (comum com HEIC). Salve como JPG ou tire um print e tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  // trocou o formato: reenquadra a mesma imagem no novo formato
  async function trocarFormato(novo: Formato) {
    setFormato(novo);
    if (!fonte) return;
    setOcupado(true);
    try {
      anexar(await recortarCentral(fonte, ALVO[novo]));
      setCortando(false);
    } catch {
      setErro("Não consegui reenquadrar a imagem. Escolha o arquivo de novo.");
    } finally {
      setOcupado(false);
    }
  }

  const aoCompletar = useCallback((_: Area, px: Area) => setArea(px), []);

  const aplicar = useCallback(async () => {
    if (!fonte || !area) return;
    setOcupado(true);
    setErro("");
    try {
      anexar(await recortar(fonte, area, giro, alvo));
      setCortando(false);
    } catch {
      setErro("Não consegui recortar essa imagem. Tente outra.");
    } finally {
      setOcupado(false);
    }
  }, [fonte, area, giro, alvo, anexar]);

  // se a pessoa publicar com o ajuste ainda aberto, aplica o ajuste antes de enviar
  useEffect(() => {
    const form = alvoFile.current?.form;
    if (!form || !cortando) return;
    const aoEnviar = (ev: SubmitEvent) => {
      if (reenviando.current) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      const quem = ev.submitter as HTMLElement | null;
      aplicar().then(() => {
        reenviando.current = true;
        try {
          form.requestSubmit(quem instanceof HTMLButtonElement || quem instanceof HTMLInputElement ? quem : undefined);
        } finally {
          reenviando.current = false;
        }
      });
    };
    form.addEventListener("submit", aoEnviar, true);
    return () => form.removeEventListener("submit", aoEnviar, true);
  }, [cortando, aplicar]);

  function remover() {
    if (alvoFile.current) alvoFile.current.value = "";
    setPrevia(null);
    setFonte(null);
    setNome("");
    setCortando(false);
  }

  const mostrar = previa ?? atual ?? null;

  return (
    <div className="upl">
      <div className="fgrid">
        {!formatoFixo && (
          <div className="fld">
            <label>Formato da imagem</label>
            <select name="formato" value={formato} onChange={(e) => trocarFormato(e.target.value as Formato)}>
              {(Object.keys(ALVO) as Formato[]).map((k) => (
                <option key={k} value={k}>{ALVO[k].rotulo}</option>
              ))}
            </select>
          </div>
        )}
        <div className="fld">
          <label>{formatoFixo ? "Banner 16:9 (opcional)" : "Imagem (opcional)"}</label>
          <input type="file" accept="image/*" onChange={escolher} disabled={ocupado} />
          {/* o arquivo já enquadrado fica aqui e vai junto com o formulário */}
          <input ref={alvoFile} type="file" name="imagem" hidden />
        </div>
      </div>

      {ocupado && <p className="dica">Preparando a imagem…</p>}
      {!ocupado && previa && (
        <p className="dica" style={{ color: "var(--ok)" }}>✓ Imagem pronta{nome ? `: ${nome}` : ""}. Ela será enviada ao publicar.</p>
      )}

      {cortando && fonte && (
        <div className="crop-box" role="dialog" aria-label="Enquadrar imagem">
          <div className="crop-area" style={{ aspectRatio: formato === "banner" ? "16 / 9" : "1 / 1" }}>
            <Cropper
              image={fonte}
              crop={crop}
              zoom={zoom}
              rotation={giro}
              aspect={alvo.w / alvo.h}
              minZoom={0.5}
              maxZoom={4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={aoCompletar}
              showGrid
              restrictPosition={false}
            />
          </div>
          <p className="dica">Arraste para posicionar e use o zoom. A área clara é o que será publicado.</p>
          <div className="crop-ctl">
            <label>
              Zoom
              <input type="range" min={0.5} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <button type="button" className="btn mini" onClick={() => setGiro((g) => (g + 90) % 360)}>⟳ Girar</button>
            <button type="button" className="btn mini" onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); setGiro(0); }}>Centralizar</button>
          </div>
          <div className="acts">
            <button type="button" className="btn primary mini" onClick={aplicar} disabled={ocupado}>
              {ocupado ? "Preparando…" : "Guardar este enquadramento"}
            </button>
            <button type="button" className="btn mini" onClick={() => setCortando(false)}>Fechar (mantém o anterior)</button>
          </div>
        </div>
      )}

      {erro && <p className="erro-in">{erro}</p>}

      {!cortando && mostrar && (
        <div className="prev">
          <img
            src={mostrar}
            alt="Prévia da imagem"
            style={{ aspectRatio: `${alvo.w} / ${alvo.h}`, maxWidth: formato === "banner" ? 420 : 220 }}
          />
          <div style={{ display: "grid", gap: 8 }}>
            {fonte && (
              <button type="button" className="btn mini" onClick={() => setCortando(true)}>Ajustar enquadramento</button>
            )}
            {previa && (
              <button type="button" className="btn danger mini" onClick={remover}>Descartar nova imagem</button>
            )}
            {atual && !previa && (
              <label className="chk">
                <input type="checkbox" name="remover_imagem" /> Remover a imagem atual
              </label>
            )}
          </div>
        </div>
      )}

      <p className="dica">
        Aceita qualquer imagem (JPG, PNG, WebP, GIF, AVIF…). Ela é enquadrada, convertida e comprimida aqui no seu
        navegador e guardada no Supabase Storage.
      </p>
    </div>
  );
}
