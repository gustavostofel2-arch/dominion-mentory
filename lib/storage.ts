import "server-only";
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

const TIPOS: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
const MAX_BYTES = 2_500_000;

/** Envia uma imagem para a pasta pública "feed". Devolve o link, ou null se não veio arquivo. */
export async function enviarImagem(arquivo: FormDataEntryValue | null, pasta: "posts" | "avisos" | "blocos"): Promise<string | null> {
  if (!(arquivo instanceof File) || arquivo.size === 0) return null;
  const ext = TIPOS[arquivo.type];
  if (!ext) throw new Error("Formato de imagem não aceito. Use JPG, PNG ou WebP.");
  if (arquivo.size > MAX_BYTES) throw new Error("Imagem muito grande (máximo 2,5 MB).");
  const caminho = `${pasta}/${randomUUID()}.${ext}`;
  const db = supabaseAdmin();
  const { error } = await db.storage
    .from("feed")
    .upload(caminho, Buffer.from(await arquivo.arrayBuffer()), { contentType: arquivo.type, cacheControl: "31536000" });
  if (error) throw error;
  return db.storage.from("feed").getPublicUrl(caminho).data.publicUrl;
}

/** Apaga do Storage a imagem de um link nosso (ignora links de fora). */
export async function apagarImagem(url: string | null | undefined) {
  if (!url) return;
  const marca = "/object/public/feed/";
  const i = url.indexOf(marca);
  if (i < 0) return;
  try {
    await supabaseAdmin().storage.from("feed").remove([url.slice(i + marca.length)]);
  } catch {
    // limpar o arquivo é opcional
  }
}
