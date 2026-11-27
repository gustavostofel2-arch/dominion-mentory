import type { Area } from "react-easy-crop";

/** Recorte e compressão de imagens, feitos no navegador antes de enviar ao Supabase Storage. */

export type Formato = "quadrada" | "retrato" | "banner";

// Tamanho final de cada formato (px). O recorte sai exatamente nessa proporção.
export const ALVO: Record<Formato, { w: number; h: number; rotulo: string }> = {
  quadrada: { w: 1080, h: 1080, rotulo: "Quadrada · 1080×1080" },
  retrato: { w: 1080, h: 1320, rotulo: "Retrato · 1080×1320" },
  banner: { w: 1600, h: 900, rotulo: "Banner · 16:9" },
};

export function carregar(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error("decode"));
    img.src = src;
  });
}

async function comprimir(canvas: HTMLCanvasElement): Promise<File> {
  let q = 0.88;
  let blob: Blob | null = null;
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", q));
    if (!blob || blob.type !== "image/webp") blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size <= 800_000) break;
    q -= 0.12;
  }
  if (!blob) throw new Error("blob");
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `imagem.${ext}`, { type: blob.type });
}

export async function recortar(src: string, area: Area, graus: number, alvo: { w: number; h: number }): Promise<File> {
  const img = await carregar(src);
  const rad = (graus * Math.PI) / 180;
  const sen = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bw = img.width * cos + img.height * sen;
  const bh = img.width * sen + img.height * cos;

  // 1) imagem girada em uma tela do tamanho certo
  const girada = document.createElement("canvas");
  girada.width = bw;
  girada.height = bh;
  const g = girada.getContext("2d");
  if (!g) throw new Error("canvas");
  g.translate(bw / 2, bh / 2);
  g.rotate(rad);
  g.drawImage(img, -img.width / 2, -img.height / 2);

  // 2) recorta a área escolhida e leva para o tamanho final
  const saida = document.createElement("canvas");
  saida.width = alvo.w;
  saida.height = alvo.h;
  const s = saida.getContext("2d");
  if (!s) throw new Error("canvas");
  s.fillStyle = "#0a0a0b";
  s.fillRect(0, 0, alvo.w, alvo.h);
  s.imageSmoothingQuality = "high";
  s.drawImage(girada, area.x, area.y, area.width, area.height, 0, 0, alvo.w, alvo.h);

  return comprimir(saida);
}

/** "Original": não recorta, só reduz (até 1600 px de largura) e comprime. */
export async function reduzir(src: string): Promise<File> {
  const img = await carregar(src);
  const escala = Math.min(1, 1600 / img.width);
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.width * escala));
  c.height = Math.max(1, Math.round(img.height * escala));
  const x = c.getContext("2d");
  if (!x) throw new Error("canvas");
  x.imageSmoothingQuality = "high";
  x.drawImage(img, 0, 0, c.width, c.height);
  return comprimir(c);
}

/** Recorte centralizado (preenche todo o formato): usado assim que a pessoa escolhe a imagem. */
export async function areaCentral(src: string, alvo: { w: number; h: number }): Promise<Area> {
  const img = await carregar(src);
  const proporcao = alvo.w / alvo.h;
  let w = img.width;
  let h = img.height;
  if (w / h > proporcao) w = h * proporcao;
  else h = w / proporcao;
  return { x: (img.width - w) / 2, y: (img.height - h) / 2, width: w, height: h };
}

export async function recortarCentral(src: string, alvo: { w: number; h: number }): Promise<File> {
  return recortar(src, await areaCentral(src, alvo), 0, alvo);
}
