"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ALVO, carregar, recortar, reduzir, type Formato } from "@/lib/recorte";
import type { FormatoImagem } from "@/lib/blocos";
import { enviarImagemBloco } from "../../painel/paginas/actions";

const ROTULO: Record<FormatoImagem, string> = {
  quadrada: ALVO.quadrada.rotulo,
  retrato: ALVO.retrato.rotulo,
  banner: ALVO.banner.rotulo,
  original: "Original (sem recorte)",
};

/** Escolhe a imagem, enquadra (ou mantém o original), comprime e envia na hora ao Supabase Storage. */
export default function CampoImagem({
  valor,
  aoMudar,
  formatos,
}: {
  valor: string;
  aoMudar: (url: string) => void;
  formatos: FormatoImagem[];
}) {
  const [formato, setFormato] = useState<FormatoImagem>(formatos[0] ?? "original");
  const [fonte, setFonte] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [giro, setGiro] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(arquivo: File) {
    const fd = new FormData();
    fd.set("imagem", arquivo);
    const r = await enviarImagemBloco(fd);
    if (!r.ok || !r.url) throw new Error(r.erro || "Falha no envio.");
    aoMudar(r.url);
  }

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErro("");
    const url = URL.createObjectURL(f);
    try {
      await carregar(url);
    } catch {
      URL.revokeObjectURL(url);
      setErro("Este navegador não abre esse formato (comum com HEIC). Salve como JPG e tente de novo.");
      return;
    }
    if (formato === "original") {
      setOcupado(true);
      try {
        await enviar(await reduzir(url));
      } catch (x) {
        setErro((x as Error).message || "Não foi possível enviar.");
      } finally {
        URL.revokeObjectURL(url);
        setOcupado(false);
      }
      return;
    }
    setFonte(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setGiro(0);
  }

  async function aplicar() {
    if (!fonte || !area || formato === "original") return;
    setOcupado(true);
    setErro("");
    try {
      await enviar(await recortar(fonte, area, giro, ALVO[formato as Formato]));
      URL.revokeObjectURL(fonte);
      setFonte(null);
    } catch (x) {
      setErro((x as Error).message || "Não foi possível enviar.");
    } finally {
      setOcupado(false);
    }
  }

  const alvo = formato === "original" ? null : ALVO[formato as Formato];

  return (
    <div className="upl campo-img">
      {valor && !fonte && (
        <div className="prev">
          <img src={valor} alt="Imagem atual" style={{ maxWidth: 260 }} />
          <button type="button" className="btn danger mini" onClick={() => aoMudar("")}>Remover imagem</button>
        </div>
      )}

      <div className="fgrid">
        {formatos.length > 1 && (
          <div className="fld">
            <label>Formato</label>
            <select
              value={formato}
              onChange={(e) => {
                setFormato(e.target.value as FormatoImagem);
              }}
            >
              {formatos.map((f) => <option key={f} value={f}>{ROTULO[f]}</option>)}
            </select>
          </div>
        )}
        <div className="fld">
          <label>{valor ? "Trocar imagem" : "Escolher imagem"}</label>
          <input type="file" accept="image/*" onChange={escolher} disabled={ocupado} />
        </div>
      </div>

      {fonte && alvo && (
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
              onCropComplete={(_, px) => setArea(px)}
              showGrid
              restrictPosition={false}
            />
          </div>
          <div className="crop-ctl">
            <label>
              Zoom
              <input type="range" min={0.5} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <button type="button" className="btn mini" onClick={() => setGiro((g) => (g + 90) % 360)}>⟳ Girar</button>
          </div>
          <div className="acts">
            <button type="button" className="btn primary mini" onClick={aplicar} disabled={ocupado}>
              {ocupado ? "Enviando…" : "Aplicar e enviar"}
            </button>
            <button type="button" className="btn mini" onClick={() => { URL.revokeObjectURL(fonte); setFonte(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      {ocupado && !fonte && <p className="dica">Enviando a imagem…</p>}
      {erro && <p className="erro-in">{erro}</p>}
    </div>
  );
}
