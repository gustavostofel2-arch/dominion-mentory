// Cookie assinado "dm_ok": guarda que este e-mail já foi conferido na lista de
// mentorados nos últimos minutos. Assim o servidor não precisa consultar o
// Supabase a cada página, imagem ou arquivo. Funciona no middleware (Edge) e nas
// rotas (Node), por isso usa WebCrypto.

export const COOKIE_OK = "dm_ok";
// Cookie legível pelo navegador, só com o nome, para mostrar "Olá, Fulano" sem
// precisar renderizar a página no servidor.
export const COOKIE_NOME = "dm_nome";
// Quanto tempo um acesso conferido vale. Desativar alguém passa a valer em até esse tempo.
export const TTL_SEGUNDOS = Number(process.env.SESSAO_TTL_S ?? 300);

export type SessaoOk = { email: string; nome: string | null };

const enc = new TextEncoder();

function b64u(bytes: Uint8Array): string {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deb64u(texto: string): Uint8Array<ArrayBuffer> {
  const s = atob(texto.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function chave(): Promise<CryptoKey> {
  const base = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return crypto.subtle.importKey("raw", enc.encode("dominion-sessao:" + base), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function assinar(s: SessaoOk): Promise<string> {
  const corpo = b64u(enc.encode(JSON.stringify({ e: s.email, n: s.nome, x: Date.now() + TTL_SEGUNDOS * 1000 })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await chave(), enc.encode(corpo)));
  return corpo + "." + b64u(sig);
}

export async function verificar(valor: string | undefined | null): Promise<SessaoOk | null> {
  if (!valor) return null;
  const [corpo, sig] = valor.split(".");
  if (!corpo || !sig) return null;
  try {
    const ok = await crypto.subtle.verify("HMAC", await chave(), deb64u(sig), enc.encode(corpo));
    if (!ok) return null;
    const dados = JSON.parse(new TextDecoder().decode(deb64u(corpo))) as { e: string; n: string | null; x: number };
    if (!dados.e || typeof dados.x !== "number" || dados.x < Date.now()) return null;
    return { email: dados.e, nome: dados.n ?? null };
  } catch {
    return null;
  }
}

export const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL_SEGUNDOS,
};

export const OPCOES_COOKIE_NOME = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
