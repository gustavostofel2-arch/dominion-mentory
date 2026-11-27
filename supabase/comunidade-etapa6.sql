-- =====================================================================
-- DOMINION MENTORY | Etapa 6: notificações agendadas
-- Rode DEPOIS das etapas anteriores. Cole no SQL Editor e clique em Run.
-- Pode rodar de novo sem problema.
-- =====================================================================
create table if not exists public.notificacoes_agendadas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  texto       text not null default '',
  link        text,
  enviar_em   timestamptz not null,
  status      text not null default 'pendente',   -- pendente | enviando | enviada | falhou
  autor_email text,
  enviada_em  timestamptz,
  criado_em   timestamptz not null default now()
);
create index if not exists notif_agendadas_status_idx on public.notificacoes_agendadas (status, enviar_em);

alter table public.notificacoes_agendadas enable row level security;
revoke all on public.notificacoes_agendadas from anon, authenticated;
