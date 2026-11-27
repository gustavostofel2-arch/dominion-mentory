-- =====================================================================
-- DOMINION MENTORY | Etapa 6: Agenda (notificações e postagens agendadas)
-- Rode DEPOIS das etapas anteriores. Cole no SQL Editor e clique em Run.
-- Pode rodar de novo sem problema.
-- =====================================================================
create table if not exists public.agenda (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null check (tipo in ('notificacao', 'postagem')),
  titulo       text not null,
  texto        text not null default '',
  link         text,
  post_id      uuid references public.posts(id) on delete cascade,
  opcoes       jsonb not null default '{}'::jsonb,   -- postagem: notificar, virar_aviso, aviso_tipo, aviso_dias
  enviar_em    timestamptz not null,
  status       text not null default 'pendente',     -- pendente | enviando | enviada | falhou | cancelada
  resultado    text,                                  -- o que aconteceu (ex.: "push para 12 aparelhos")
  erro         text,                                  -- motivo da falha
  tentativas   int not null default 0,
  autor_email  text,
  criado_em    timestamptz not null default now(),
  concluido_em timestamptz
);
create index if not exists agenda_status_idx on public.agenda (status, enviar_em);
create index if not exists agenda_post_idx on public.agenda (post_id);

-- "batimento" do verificador automático: mostra no Admin se ele está rodando
create table if not exists public.agenda_pulso (
  id              int primary key default 1 check (id = 1),
  ultima_execucao timestamptz not null default now(),
  resumo          text
);

alter table public.agenda enable row level security;
alter table public.agenda_pulso enable row level security;
revoke all on public.agenda from anon, authenticated;
revoke all on public.agenda_pulso from anon, authenticated;
