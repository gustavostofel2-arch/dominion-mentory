import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { lerAvisosAdmin, lerCatalogoCompleto } from "@/lib/catalogo";

async function listarAdmins(): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin().from("admins").select("email").order("email");
    if (error) throw error;
    return (data ?? []).map((r: { email: string }) => r.email);
  } catch {
    return [];
  }
}

export default async function AdminInicio() {
  const [{ modulos, doBanco }, avisos, admins] = await Promise.all([lerCatalogoCompleto(), lerAvisosAdmin(), listarAdmins()]);
  const itens = modulos.reduce((n, m) => n + m.itens.length, 0);
  const avisosAtivos = avisos.filter((a) => a.ativo && (!a.expiraEm || new Date(a.expiraEm).getTime() > Date.now())).length;

  return (
    <>
      {!doBanco && (
        <div className="nota">
          O banco ainda não tem as tabelas da etapa 1, então o painel está mostrando o conteúdo de reserva. No Supabase, abra{" "}
          <b>SQL Editor</b>, cole o arquivo <code>supabase/comunidade-etapa1.sql</code> e clique em <b>Run</b>; depois faça o mesmo com <code>supabase/comunidade-etapa2.sql</code>.
        </div>
      )}

      <div className="acoes-adm">
        <Link href="/painel/admin/paginas">
          <b>Menu e páginas</b>
          <span>Crie e organize as abas. Monte cada uma com blocos.</span>
        </Link>
        <Link href="/painel/admin/posts#novo">
          <b>Nova postagem</b>
          <span>Novidade ou aula. Aparece em Novidades e pode virar aviso.</span>
        </Link>
        <Link href="/painel/admin/avisos">
          <b>Novo aviso</b>
          <span>Algo urgente (call, prazo). Passa no carrossel do Início.</span>
        </Link>
        <Link href="/painel/admin/notificacoes">
          <b>Nova notificação</b>
          <span>Sino e push para toda a comunidade, na hora.</span>
        </Link>
      </div>

      <div className="kpis">
        <div className="stat"><b>{modulos.length}</b><span>módulos</span></div>
        <div className="stat"><b>{itens}</b><span>ferramentas</span></div>
        <div className="stat"><b>{avisosAtivos}</b><span>avisos no ar</span></div>
      </div>

      <div className="panel">
        <h2>O que você pode fazer aqui</h2>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#d2d0ca", display: "grid", gap: 6 }}>
          <li><b>Avisos:</b> faixa em destaque no topo do painel, com banner 16:9, botão e data para sair do ar.</li>
          <li><b>Postagens:</b> novidades com título, negrito, emojis, links e imagem. Os alunos curtem e comentam.</li>
          <li><b>Módulos e ferramentas:</b> criar, renomear, trocar o link, mudar a ordem, esconder ou excluir.</li>
          <li>Em breve: notificações push, inclusive agendadas.</li>
        </ul>
      </div>

      <div className="panel">
        <h2>Quem é admin</h2>
        {admins.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Nenhum admin encontrado (as tabelas ainda não existem).</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: "#d2d0ca", display: "grid", gap: 4 }}>
            {admins.map((e) => <li key={e}>{e}</li>)}
          </ul>
        )}
        <p style={{ color: "var(--muted)", fontSize: ".85rem", marginTop: 12 }}>
          Para incluir outro admin, rode no SQL Editor: <code>insert into public.admins (email) values (&apos;novo@email.com&apos;);</code> A
          pessoa também precisa estar na lista de mentorados ativos.
        </p>
      </div>
    </>
  );
}
