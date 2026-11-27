"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ALVO, carregar, recortar, recortarCentral, reduzir, type Formato } from "@/lib/recorte";
import type { FormatoImagem } from "@/lib/blocos";
import { enviarImagemBloco } from "../../painel/paginas/actions";

const ROTULO: Record<FormatoImagem, string> = {
  quadrada: ALVO.quadrada.rotulo,
  retrato: ALVO.retrato.rotulo,
  banner: ALVO.banner.rotulo,
  original: "Original (sem recorte)",
};

/**
 * Escolhe a imagem e já enquadra no centro, comprime e envia ao Supabase Storage na hora.
 * "Ajustar enquadramento" é opcional: serve para reposicionar e enviar de novo.
 */
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
  const [ajustando, setAjustando] = useState(false);
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

  /** Gera o arquivo no formato escolhido (centralizado) e envia. */
  async function processar(url: string, f: FormatoImagem) {
    const arquivo = f === "original" ? await reduzir(url) : await recortarCentral(url, ALVO[f as Formato]);
    await enviar(arquivo);
  }

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErro("");
    const url = URL.createObjectURL(f);
    setOcupado(true);
    try {
      await carregar(url);
      await processar(url, formato);
      setFonte((antes) => {
        if (antes) URL.revokeObjectURL(antes);
        return url;
      });
      setAjustando(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setGiro(0);
    } catch (x) {
      URL.revokeObjectURL(url);
      const m = (x as Error).message;
      setErro(m === "decode" ? "Este navegador não abre esse formato (comum com HEIC). Salve como JPG e tente de novo." : m || "Não foi possível enviar.");
    } finally {
      setOcupado(false);
    }
  }

  async function trocarFormato(novo: FormatoImagem) {
    setFormato(novo);
    if (!fonte) return;
    setOcupado(true);
    setErro("");
    try {
      await processar(fonte, novo);
      setAjustando(false);
    } catch (x) {
      setErro((x as Error).message || "Não foi possível reenquadrar.");
    } finally {
      setOcupado(false);
    }
  }

  async function guardarAjuste() {
    if (!fonte || !area || formato === "original") return;
    setOcupado(true);
    setErro("");
    try {
      await enviar(await recortar(fonte, area, giro, ALVO[formato as Formato]));
      setAjustando(false);
    } catch (x) {
      setErro((x as Error).message || "Não foi possível enviar.");
    } finally {
      setOcupado(false);
    }
  }

  const alvo = formato === "original" ? null : ALVO[formato as Formato];

  return (
    <div className="upl campo-img">
      {valor && !ajustando && (
        <div className="prev">
          <img src={valor} alt="Imagem atual" style={{ maxWidth: 260 }} />
          <div style={{ display: "grid", gap: 8 }}>
            {fonte && alvo && (
              <button type="button" className="btn mini" onClick={() => setAjustando(true)}>Ajustar enquadramento</button>
            )}
            <button type="button" className="btn danger mini" onClick={() => aoMudar("")}>Remover imagem</button>
          </div>
        </div>
      )}

      <div className="fgrid">
        {formatos.length > 1 && (
          <div className="fld">
            <label>Formato</label>
            <select value={formato} onChange={(e) => trocarFormato(e.target.value as FormatoImagem)} disabled={ocupado}>
              {formatos.map((f) => <option key={f} value={f}>{ROTULO[f]}</option>)}
            </select>
          </div>
        )}
        <div className="fld">
          <label>{valor ? "Trocar imagem" : "Escolher imagem"}</label>
          <input type="file" accept="image/*" onChange={escolher} disabled={ocupado} />
        </div>
      </div>

      {ocupado && <p className="dica">Enviando a imagem…</p>}

      {ajustando && fonte && alvo && (
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
            <button type="button" className="btn primary mini" onClick={guardarAjuste} disabled={ocupado}>
              {ocupado ? "Enviando…" : "Guardar este enquadramento"}
            </button>
            <button type="button" className="btn mini" onClick={() => setAjustando(false)}>Fechar (mantém o anterior)</button>
          </div>
        </div>
      )}

      {erro && <p className="erro-in">{erro}</p>}
    </div>
  );
}
