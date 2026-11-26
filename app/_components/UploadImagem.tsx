"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ALVO, carregar, recortar, type Formato } from "@/lib/recorte";

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
  const [cortando, setCortando] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [giro, setGiro] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const alvoFile = useRef<HTMLInputElement>(null);

  const alvo = ALVO[formato];

  useEffect(
    () => () => {
      if (fonte) URL.revokeObjectURL(fonte);
    },
    [fonte],
  );

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErro("");
    if (!f.type.startsWith("image/") && !/\.(heic|heif|avif|bmp|gif|tiff?|svg)$/i.test(f.name)) {
      setErro("Escolha um arquivo de imagem.");
      return;
    }
    const url = URL.createObjectURL(f);
    // confere se o navegador consegue abrir esse formato antes de mostrar o recorte
    carregar(url)
      .then(() => {
        setFonte(url);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setGiro(0);
        setCortando(true);
      })
      .catch(() => {
        URL.revokeObjectURL(url);
        setErro("Este navegador não consegue abrir esse formato (comum com HEIC). Tire um print ou salve como JPG e tente de novo.");
      });
    e.target.value = "";
  }

  const aoCompletar = useCallback((_: Area, px: Area) => setArea(px), []);

  async function aplicar() {
    if (!fonte || !area || !alvoFile.current) return;
    setOcupado(true);
    setErro("");
    try {
      const arquivo = await recortar(fonte, area, giro, alvo);
      const dt = new DataTransfer();
      dt.items.add(arquivo);
      alvoFile.current.files = dt.files;
      setPrevia((antes) => {
        if (antes) URL.revokeObjectURL(antes);
        return URL.createObjectURL(arquivo);
      });
      setCortando(false);
    } catch {
      setErro("Não consegui recortar essa imagem. Tente outra.");
    } finally {
      setOcupado(false);
    }
  }

  function remover() {
    if (alvoFile.current) alvoFile.current.value = "";
    setPrevia(null);
    setFonte(null);
    setCortando(false);
  }

  const mostrar = previa ?? atual ?? null;

  return (
    <div className="upl">
      <div className="fgrid">
        {!formatoFixo && (
          <div className="fld">
            <label>Formato da imagem</label>
            <select
              name="formato"
              value={formato}
              onChange={(e) => {
                setFormato(e.target.value as Formato);
                if (fonte) setCortando(true); // a proporção mudou: enquadrar de novo
              }}
            >
              {(Object.keys(ALVO) as Formato[]).map((k) => (
                <option key={k} value={k}>{ALVO[k].rotulo}</option>
              ))}
            </select>
          </div>
        )}
        <div className="fld">
          <label>{formatoFixo ? "Banner 16:9 (opcional)" : "Imagem (opcional)"}</label>
          <input ref={entrada} type="file" accept="image/*" onChange={escolher} />
          {/* o arquivo recortado fica aqui e vai junto com o formulário */}
          <input ref={alvoFile} type="file" name="imagem" hidden />
        </div>
      </div>

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
          <p className="dica">Arraste para posicionar. Use o zoom para aproximar ou afastar. A área clara é o que será publicado.</p>
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
              {ocupado ? "Preparando…" : "Aplicar enquadramento"}
            </button>
            <button type="button" className="btn mini" onClick={() => setCortando(false)}>Cancelar</button>
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
