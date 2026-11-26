-- =====================================================================
-- DOMINION MENTORY | Etapa 5: páginas e blocos personalizáveis
-- Rode DEPOIS das etapas 1 a 4. Cole tudo no SQL Editor e clique em Run.
-- Pode rodar de novo sem problema. O conteúdo inicial das páginas é criado
-- sozinho pelo site na primeira visita (não precisa inserir nada aqui).
-- =====================================================================

-- 1) Páginas (as abas do menu) ----------------------------------------------
create table if not exists public.paginas (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null,
  titulo             text not null,
  menu_rotulo        text,                          -- nome curto no menu (se vazio, usa o título)
  etiqueta           text,                          -- texto pequeno acima do título
  descricao          text,                          -- frase abaixo do título
  icone              text not null default 'grid',
  no_menu            boolean not null default true, -- aparece no menu lateral
  visivel            boolean not null default true, -- escondida = só admin vê
  mostrar_cabecalho  boolean not null default true,
  protegida          boolean not null default false,-- o Início não pode ser apagado
  ordem              int not null default 0,
  criado_em          timestamptz not null default now(),
  constraint paginas_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40)
);
create unique index if not exists paginas_slug_uniq on public.paginas (slug);
create index if not exists paginas_menu_idx on public.paginas (visivel, no_menu, ordem);

-- 2) Blocos (o conteúdo de cada página) --------------------------------------
create table if not exists public.blocos (
  id         uuid primary key default gen_random_uuid(),
  pagina_id  uuid not null references public.paginas(id) on delete cascade,
  tipo       text not null,
  dados      jsonb not null default '{}'::jsonb,
  ordem      int not null default 0,
  visivel    boolean not null default true,
  criado_em  timestamptz not null default now()
);
create index if not exists blocos_pagina_idx on public.blocos (pagina_id, ordem);

-- 3) Segurança: só o servidor (service_role) lê e escreve ---------------------
alter table public.paginas enable row level security;
alter table public.blocos  enable row level security;
revoke all on public.paginas, public.blocos from anon, authenticated;
