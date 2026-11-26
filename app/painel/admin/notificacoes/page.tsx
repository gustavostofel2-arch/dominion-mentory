import { supabaseAdmin } from "@/lib/supabase/admin";
import { listarNotificacoes, pushConfigurado } from "@/lib/notificar";
import { tempoRelativo } from "@/lib/tempo";
import { enviarComunicado } from "../actions";

async function contarAparelhos(): Promise<number> {
  try {
    const { count } = await supabaseAdmin().from("push_inscricoes").select("endpoint", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

type Linha = { id: string; push_ok: number; push_falha: number };

async function contagens(ids: string[]): Promise<Map<string, Linha>> {
  const m = new Map<string, Linha>();
  if (!ids.length) return m;
  try {
    const { data } = await supabaseAdmin().from("notificacoes").select("id,push_ok,push_falha").in("id", ids);
    for (const l of (data ?? []) as Linha[]) m.set(l.id, l);
  } catch {
    // sem números, só a lista
  }
  return m;
}

const ROTULO = { aviso: "Aviso", post: "Postagem", manual: "Comunicado" } as const;

export default async function AdminNotificacoes({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const [{ ok, erro }, lista, aparelhos] = await Promise.all([searchParams, listarNotificacoes(30), contarAparelhos()]);
  const nums = await contagens(lista.map((n) => n.id));
  const push = pushConfigurado();

  return (
    <>
      {ok && <div className="nota">{ok}</div>}
      {erro && <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>{erro}</div>}

      <div className="kpis">
        <div className="stat"><b>{aparelhos}</b><span>aparelhos com push ativo</span></div>
        <div className="stat"><b>{lista.length}</b><span>notificações recentes</span></div>
        <div className="stat"><b>{push ? "Ligado" : "Desligado"}</b><span>envio de push</span></div>
      </div>

      {!push && (
        <div className="nota">
          O <b>push</b> ainda não está configurado: por enquanto as notificações aparecem só no <b>sino</b> do painel. Para ligar o push, gere as chaves
          com <code>npx web-push generate-vapid-keys</code> e cadastre na Vercel as variáveis <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> e{" "}
          <code>VAPID_PRIVATE_KEY</code> (depois, faça um novo deploy).
        </div>
      )}

      <div className="panel">
        <h2>Enviar um comunicado agora</h2>
        <form action={enviarComunicado}>
          <div className="fgrid">
            <div className="fld full">
              <label>Título</label>
              <input type="text" name="titulo" required maxLength={120} placeholder="Ex.: Call começando em 10 minutos" />
            </div>
            <div className="fld full">
              <label>Mensagem (curta, até 180 caracteres)</label>
              <textarea name="texto" maxLength={180} placeholder="Ex.: Entre agora pelo link que está no grupo." />
            </div>
            <div className="fld full">
              <label>Ao tocar, abrir (opcional)</label>
              <input type="text" name="link" maxLength={600} placeholder="https://… ou /painel/novidades" />
            </div>
          </div>
          <div className="acts">
            <button className="btn primary" type="submit">Notificar toda a comunidade</button>
          </div>
        </form>
      </div>

      <h3 style={{ fontSize: ".95rem", margin: "26px 0 8px" }}>Enviadas recentemente</h3>
      {lista.length === 0 && <p style={{ color: "var(--muted)" }}>Nenhuma notificação enviada ainda.</p>}
      <div className="hist">
        {lista.map((n) => {
          const c = nums.get(n.id);
          return (
            <div className="hist-i" key={n.id}>
              <div>
                <b>{n.titulo}</b>
                {n.texto && <span>{n.texto}</span>}
              </div>
              <small>
                {ROTULO[n.tipo]} · {tempoRelativo(n.criadoEm)}
                {c ? ` · push: ${c.push_ok} ok${c.push_falha ? `, ${c.push_falha} falha(s)` : ""}` : ""}
              </small>
            </div>
          );
        })}
      </div>
    </>
  );
}
