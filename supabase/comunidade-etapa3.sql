-- =====================================================================
-- DOMINION MENTORY | Etapa 3: notificações (sino + push)
-- Rode DEPOIS das etapas 1 e 2. Cole tudo no SQL Editor e clique em Run.
-- Pode rodar de novo sem problema.
-- =====================================================================

-- 1) Notificações enviadas à comunidade ---------------------------------
create table if not exists public.notificacoes (
  id           uuid primary key default gen_random_uuid(),
  tipo         text not null default 'manual' check (tipo in ('post','aviso','manual')),
  titulo       text not null,
  texto        text not null default '',
  link         text,
  imagem_url   text,
  ref_id       uuid,
  autor_email  text,
  push_ok      int  not null default 0,   -- quantos aparelhos receberam o push
  push_falha   int  not null default 0,
  criado_em    timestamptz not null default now()
);
create index if not exists notificacoes_recentes_idx on public.notificacoes (criado_em desc);

-- 2) Até quando cada pessoa já leu (para o número vermelho do sino) -------
create table if not exists public.notif_estado (
  email     text primary key,
  lido_ate  timestamptz not null default now()
);

-- 3) Aparelhos que ativaram o push ----------------------------------------
create table if not exists public.push_inscricoes (
  endpoint    text primary key,
  email       text not null,
  p256dh      text not null,
  auth        text not null,
  agente      text,
  criado_em   timestamptz not null default now()
);
create index if not exists push_inscricoes_email_idx on public.push_inscricoes (email);

-- 4) Segurança: só o servidor (service_role) lê e escreve -----------------
alter table public.notificacoes    enable row level security;
alter table public.notif_estado    enable row level security;
alter table public.push_inscricoes enable row level security;
revoke all on public.notificacoes, public.notif_estado, public.push_inscricoes from anon, authenticated;
