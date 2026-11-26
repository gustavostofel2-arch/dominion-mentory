-- =====================================================================
-- DOMINION MENTORY | Etapa 2: novidades (feed), curtidas, comentários e imagens
-- Rode DEPOIS do comunidade-etapa1.sql. Cole tudo no SQL Editor e clique em Run.
-- Pode rodar de novo sem problema.
-- =====================================================================

-- 1) Postagens (só admin cria) ------------------------------------------
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  corpo        text not null default '',
  imagem_url   text,
  formato      text check (formato in ('quadrada','retrato','banner')),
  fixado       boolean not null default false,   -- aparece em "Em destaque" no Início
  publicado    boolean not null default true,
  autor_email  text,
  autor_nome   text,
  criado_em    timestamptz not null default now()
);
create index if not exists posts_lista_idx on public.posts (publicado, fixado desc, criado_em desc);

-- 2) Curtidas (uma por pessoa por post) ---------------------------------
create table if not exists public.curtidas (
  post_id    uuid not null references public.posts(id) on delete cascade,
  email      text not null,
  criado_em  timestamptz not null default now(),
  primary key (post_id, email)
);

-- 3) Comentários (alunos e admins) --------------------------------------
create table if not exists public.comentarios (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  email      text not null,
  nome       text,
  texto      text not null,
  criado_em  timestamptz not null default now()
);
create index if not exists comentarios_post_idx on public.comentarios (post_id, criado_em);
create index if not exists comentarios_email_idx on public.comentarios (email, criado_em desc);

-- 4) Banner (imagem 16:9) nos avisos -------------------------------------
alter table public.avisos add column if not exists imagem_url text;

-- 5) Segurança: só o servidor (service_role) lê e escreve ----------------
alter table public.posts       enable row level security;
alter table public.curtidas    enable row level security;
alter table public.comentarios enable row level security;
revoke all on public.posts, public.curtidas, public.comentarios from anon, authenticated;

-- 6) Pasta de imagens (leitura pública pelo link; só o servidor envia) ---
insert into storage.buckets (id, name, public)
values ('feed', 'feed', true)
on conflict (id) do nothing;
