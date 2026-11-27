import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { paraCampoData, type ItemAgenda } from "@/lib/agenda";
import { apagarDoHistorico, cancelarAgendamento, editarAgendamento, enviarAgoraAgendamento, enviarComunicado, verificarAgendaAgora } from "../actions";
import ConfirmButton from "../ConfirmButton";
import CampoEmoji from "../../../_components/CampoEmoji";

export const dynamic = "force-dynamic";

const ROTULO_STATUS: Record<string, string> = {
  pendente: "Agendada",
  enviando: "Enviando…",
  enviada: "Enviada",
  falhou: "Falhou",
  cancelada: "Cancelada",
};

function quandoBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function faltam(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "atrasada: sai no próximo minuto";
  const min = Math.round(ms / 60000);
  if (min < 60) return `em ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `em ${h} h ${min % 60} min`;
  return `em ${Math.floor(h / 24)} dia(s)`;
}

function ha(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "agora há pouco";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `há ${h} h` : `há ${Math.floor(h / 24)} dia(s)`;
}

type Pulso = { ultima_execucao: string; resumo: string | null };

async function carregar(): Promise<{ itens: ItemAgenda[]; pulso: Pulso | null; semTabela: boolean }> {
  try {
    const db = supabaseAdmin();
    const [a, p] = await Promise.all([
      db.from("agenda").select("*").order("enviar_em", { ascending: false }).limit(200),
      db.from("agenda_pulso").select("ultima_execucao,resumo").eq("id", 1).maybeSingle(),
    ]);
    if (a.error) return { itens: [], pulso: null, semTabela: /does not exist|schema cache|could not find/i.test(a.error.message) };
    return { itens: (a.data ?? []) as ItemAgenda[], pulso: (p.data as Pulso | null) ?? null, semTabela: false };
  } catch {
    return { itens: [], pulso: null, semTabela: false };
  }
}

export default async function AdminAgenda() {
  const { itens, pulso, semTabela } = await carregar();
  const proximas = itens.filter((i) => i.status === "pendente" || i.status === "enviando").sort((x, y) => +new Date(x.enviar_em) - +new Date(y.enviar_em));
  const historico = itens.filter((i) => !(i.status === "pendente" || i.status === "enviando")).slice(0, 40);
  const enviadas = itens.filter((i) => i.status === "enviada").length;
  const falhas = itens.filter((i) => i.status === "falhou").length;
  const minutosSemPulso = pulso ? (Date.now() - new Date(pulso.ultima_execucao).getTime()) / 60000 : Infinity;
  const relogioOk = minutosSemPulso <= 3;
  const atrasadas = proximas.filter((i) => new Date(i.enviar_em).getTime() < Date.now() - 2 * 60000).length;

  if (semTabela) {
    return (
      <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>
        A Agenda ainda não existe no Supabase. Abra o <b>SQL Editor</b>, cole o conteúdo do arquivo <code>supabase/comunidade-etapa6.sql</code> e clique em <b>Run</b>. Depois recarregue esta página.
      </div>
    );
  }

  return (
    <>
      <div className="kpis">
        <div className="stat"><b>{proximas.length}</b><span>agendadas (aguardando)</span></div>
        <div className="stat"><b>{enviadas}</b><span>enviadas com sucesso</span></div>
        <div className="stat"><b style={falhas ? { color: "var(--warn)" } : undefined}>{falhas}</b><span>com falha</span></div>
      </div>

      <div className={"relogio " + (relogioOk ? "ok" : "ruim")}>
        <span className="ponto" aria-hidden />
        <div>
          <b>{relogioOk ? "Verificador automático funcionando" : pulso ? "Verificador automático parado?" : "Verificador automático ainda não rodou"}</b>
          <small>
            {pulso ? `Última checagem ${ha(pulso.ultima_execucao)}${pulso.resumo ? ` · ${pulso.resumo}` : ""}.` : "Ele roda sozinho a cada minuto depois do deploy na Vercel (plano Pro)."}
            {!relogioOk && " Enquanto isso, use o botão “Verificar agora”: ele envia o que já passou da hora."}
          </small>
        </div>
        <form action={verificarAgendaAgora}>
          <button className="btn mini" type="submit">Verificar agora</button>
        </form>
      </div>
      {atrasadas > 0 && (
        <div className="nota" style={{ borderColor: "var(--warn)", background: "var(--warn-soft)", color: "#ffb69b" }}>
          {atrasadas} item(ns) passaram da hora e ainda não saíram. Clique em <b>Verificar agora</b> acima.
        </div>
      )}

      <div className="panel" id="novo">
        <h2>Agendar uma notificação</h2>
        <form action={enviarComunicado}>
          <div className="fgrid">
            <CampoEmoji nome="titulo" rotulo="Título" max={120} obrigatorio placeholder="Ex.: 🔥 Call começando em 10 minutos" />
            <CampoEmoji nome="texto" rotulo="Mensagem (até 180 caracteres)" max={180} varias placeholder="Ex.: Entre agora pelo link da call." />
            <div className="fld full">
              <label>Ao tocar, abrir (opcional)</label>
              <input type="text" name="link" maxLength={600} placeholder="Link da call (Meet, Zoom…) ou /painel/novidades" />
            </div>
            <div className="fld full">
              <label>Enviar em (horário de Brasília)</label>
              <input type="datetime-local" name="quando" required />
            </div>
          </div>
          <div className="acts"><button className="btn primary" type="submit">Agendar notificação</button></div>
        </form>
        <p className="dica" style={{ marginTop: 10 }}>
          Para agendar uma <b>postagem</b>, vá em <Link href="/painel/admin/posts#novo">Postagens</Link> e preencha “Agendar publicação”. Ela aparece aqui também.
        </p>
      </div>

      <h3 className="sec-t">Próximas ({proximas.length})</h3>
      {proximas.length === 0 && <p style={{ color: "var(--muted)" }}>Nada agendado no momento.</p>}
      {proximas.map((i) => (
        <details className="it" key={i.id}>
          <summary>
            <span>{i.tipo === "postagem" ? "📝" : "🔔"} {i.titulo}</span>
            <span className={"st st-" + i.status}>{ROTULO_STATUS[i.status]}</span>
            <span className="meta">{quandoBR(i.enviar_em)} · {faltam(i.enviar_em)}</span>
          </summary>
          <form>
            <input type="hidden" name="id" value={i.id} />
            <input type="hidden" name="tipo" value={i.tipo} />
            <div className="fgrid">
              {i.tipo === "notificacao" ? (
                <>
                  <CampoEmoji nome="titulo" rotulo="Título" max={120} obrigatorio inicial={i.titulo} />
                  <CampoEmoji nome="texto" rotulo="Mensagem" max={180} varias inicial={i.texto} />
                  <div className="fld full">
                    <label>Ao tocar, abrir</label>
                    <input type="text" name="link" maxLength={600} defaultValue={i.link ?? ""} />
                  </div>
                </>
              ) : (
                <div className="fld full">
                  <p className="dica">
                    Postagem “{i.titulo}”. {i.opcoes?.virar_aviso ? "Vira aviso no Início. " : ""}
                    {i.opcoes?.notificar ? "Notifica a comunidade. " : ""}
                    Para mudar o texto ou a imagem, use <b>Editar postagem</b>.
                  </p>
                </div>
              )}
              <div className="fld full">
                <label>Sai em (horário de Brasília)</label>
                <input type="datetime-local" name="quando" required defaultValue={paraCampoData(i.enviar_em)} />
              </div>
            </div>
            <div className="acts">
              <button className="btn primary mini" type="submit" formAction={editarAgendamento}>Salvar mudanças</button>
              <ConfirmButton action={enviarAgoraAgendamento} msg="Enviar agora, sem esperar o horário?" className="btn mini">Enviar agora</ConfirmButton>
              {i.tipo === "postagem" && i.post_id && <Link className="btn mini" href={`/painel/admin/posts#p-${i.post_id}`}>Editar postagem</Link>}
              <ConfirmButton action={cancelarAgendamento} msg="Cancelar este agendamento?" className="btn danger mini">Cancelar</ConfirmButton>
            </div>
          </form>
        </details>
      ))}

      <h3 className="sec-t">Histórico</h3>
      {historico.length === 0 && <p style={{ color: "var(--muted)" }}>Ainda não saiu nada pela Agenda.</p>}
      <div className="hist">
        {historico.map((i) => (
          <div className="hist-i" key={i.id}>
            <div>
              <b>{i.tipo === "postagem" ? "📝" : "🔔"} {i.titulo}</b>
              <span>
                <em className={"st st-" + i.status}>{ROTULO_STATUS[i.status]}</em> {i.resultado ?? ""}
              </span>
              {i.erro && <span className="erro-linha">⚠ {i.erro}</span>}
            </div>
            <small>
              era para {quandoBR(i.enviar_em)}
              {i.concluido_em ? ` · ${ha(i.concluido_em)}` : ""}
              <form style={{ display: "inline", marginLeft: 8 }}>
                <input type="hidden" name="id" value={i.id} />
                {i.status === "falhou" && (
                  <button className="btn mini" type="submit" formAction={enviarAgoraAgendamento}>Tentar de novo</button>
                )}{" "}
                <button className="btn mini" type="submit" formAction={apagarDoHistorico} title="Remover da lista">✕</button>
              </form>
            </small>
          </div>
        ))}
      </div>
    </>
  );
}
