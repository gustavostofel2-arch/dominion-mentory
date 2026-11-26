"use client";

import { useEffect, useRef, useState } from "react";

type Formato = "quadrada" | "retrato" | "banner";

// Tamanhos finais (px). A imagem é recortada ao centro na proporção escolhida e comprimida.
const ALVO: Record<Formato, { w: number; h: number; rotulo: string }> = {
  quadrada: { w: 1080, h: 1080, rotulo: "Quadrada 1080×1080" },
  retrato: { w: 1080, h: 1320, rotulo: "Retrato 1080×1320" },
  banner: { w: 1600, h: 900, rotulo: "Banner 16:9" },
};

async function processar(arquivo: File, formato: Formato): Promise<File> {
  const bmp = await createImageBitmap(arquivo);
  const { w, h } = ALVO[formato];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sem canvas");
  // "cover": preenche tudo e corta o excesso no centro
  const escala = Math.max(w / bmp.width, h / bmp.height);
  const sw = w / escala;
  const sh = h / escala;
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, 0, 0, w, h);
  bmp.close();
  let q = 0.85;
  let blob: Blob | null = null;
  while (q > 0.4) {
    blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", q));
    if (blob && blob.size <= 700_000) break;
    q -= 0.1;
  }
  if (!blob) throw new Error("falha ao comprimir");
  return new File([blob], "imagem.webp", { type: "image/webp" });
}

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
  const [original, setOriginal] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const alvo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!original) return;
    let vivo = true;
    setOcupado(true);
    setErro("");
    processar(original, formato)
      .then((f) => {
        if (!vivo || !alvo.current) return;
        const dt = new DataTransfer();
        dt.items.add(f);
        alvo.current.files = dt.files;
        setPrevia((antes) => {
          if (antes) URL.revokeObjectURL(antes);
          return URL.createObjectURL(f);
        });
      })
      .catch(() => vivo && setErro("Não consegui ler essa imagem. Tente outra (JPG, PNG ou WebP)."))
      .finally(() => vivo && setOcupado(false));
    return () => {
      vivo = false;
    };
  }, [original, formato]);

  function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErro("Escolha um arquivo de imagem.");
    setOriginal(f);
  }

  const mostrar = previa ?? atual ?? null;

  return (
    <div className="upl">
      <div className="fgrid">
        {!formatoFixo && (
          <div className="fld">
            <label>Formato da imagem</label>
            <select name="formato" value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
              {(Object.keys(ALVO) as Formato[]).map((k) => (
                <option key={k} value={k}>{ALVO[k].rotulo}</option>
              ))}
            </select>
          </div>
        )}
        <div className="fld">
          <label>{formatoFixo ? "Banner 16:9 (opcional)" : "Imagem (opcional)"}</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolher} />
          {/* o arquivo já comprimido é colocado aqui para ir junto com o formulário */}
          <input ref={alvo} type="file" name="imagem" hidden />
        </div>
      </div>
      {ocupado && <p className="dica">Preparando a imagem…</p>}
      {erro && <p className="erro-in">{erro}</p>}
      {mostrar && (
        <div className="prev">
          <img
            src={mostrar}
            alt="Prévia da imagem"
            style={{ aspectRatio: ALVO[formato].w + " / " + ALVO[formato].h, maxWidth: formato === "banner" ? 420 : 220 }}
          />
          {atual && !previa && (
            <label className="chk">
              <input type="checkbox" name="remover_imagem" /> Remover a imagem atual
            </label>
          )}
        </div>
      )}
      <p className="dica">
        A imagem é recortada ao centro no formato escolhido e comprimida automaticamente, para não pesar no banco.
      </p>
    </div>
  );
}
