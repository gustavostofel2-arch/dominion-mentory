import { supabaseAdmin } from "@/lib/supabase/admin";
import { listarNotificacoes, pushConfigurado } from "@/lib/notificar";
import { tempoRelativo } from "@/lib/tempo";
import { cancelarAgendada, enviarComunicado } from "../actions";
import CampoEmoji from "../../../_components/CampoEmoji";

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

type Agendada = { id: string; titulo: string; texto: string; enviar_em: string; status: string };

async function agendadas(): Promise<Agendada[]> {
  try {
    const { data } = await supabaseAdmin()
      .from("notificacoes_agendadas")
      .select("id,titulo,texto,enviar_em,status")
      .in("status", ["pendente", "enviando", "falhou"])
      .order("enviar_em")
      .limit(30);
    return (data ?? []) as Agendada[];
  } catch {
    return [];
  }
}

function quandoBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const ROTULO = { aviso: "Aviso", post: "Postagem", manual: "Comunicado" } as const;

export default async function AdminNotificacoes() {
  // as mensagens (?ok= / ?erro=) são lidas no navegador pelo MensagemAdmin; a página não depende da URL
  const searchParams = Promise.resolve({} as { ok?: string; erro?: string });
  const [{ ok, erro }, lista, aparelhos, fila] = await Promise.all([searchParams, listarNotificacoes(30), contarAparelhos(), agendadas()]);
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
            <CampoEmoji nome="titulo" rotulo="Título" max={120} obrigatorio placeholder="Ex.: 🔥 Call começando em 10 minutos" />
            <CampoEmoji nome="texto" rotulo="Mensagem (curta, até 180 caracteres)" max={180} varias placeholder="Ex.: Entre agora pelo link da call." />
            <div className="fld full">
              <label>Ao tocar, abrir (opcional)</label>
              <input type="text" name="link" maxLength={600} placeholder="Link da call (Meet, Zoom…) ou /painel/novidades" />
              <p className="dica">Cole o link do Meet ou de qualquer site: quem tocar na notificação já cai nele. Se deixar vazio, abre o painel.</p>
            </div>
            <div className="fld full">
              <label>Enviar em (opcional, horário de Brasília)</label>
              <input type="datetime-local" name="quando" />
              <p className="dica">Deixe vazio para enviar agora. Com data e hora, a notificação sai sozinha no horário.</p>
            </div>
          </div>
          <div className="acts">
            <button className="btn primary" type="submit">Enviar / agendar notificação</button>
          </div>
        </form>
      </div>

      {fila.length > 0 && (
        <>
          <h3 style={{ fontSize: ".95rem", margin: "26px 0 8px" }}>Agendadas</h3>
          <div className="hist">
            {fila.map((a) => (
              <div className="hist-i" key={a.id}>
                <div>
                  <b>{a.titulo}</b>
                  {a.texto && <span>{a.texto}</span>}
                </div>
                <small>
                  {a.status === "falhou" ? "falhou" : "sai em " + quandoBR(a.enviar_em)}
                  {a.status === "pendente" && (
                    <form action={cancelarAgendada} style={{ display: "inline", marginLeft: 10 }}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn danger mini" type="submit">Cancelar</button>
                    </form>
                  )}
                </small>
              </div>
            ))}
          </div>
          {!process.env.CRON_SECRET && (
            <div className="nota">Falta cadastrar na Vercel a variável <code>CRON_SECRET</code> (qualquer texto longo e secreto) e fazer um novo deploy, senão os agendamentos não saem.</div>
          )}
        </>
      )}

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
