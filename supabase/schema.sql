-- =====================================================================
-- DOMINION MENTORY | acesso por e-mail
-- Cole TUDO isto no Supabase: SQL Editor > New query > Run.
-- Pode rodar de novo sem problema (usa "if not exists" / "or replace").
-- =====================================================================

-- 1) Lista de mentorados com acesso ---------------------------------
create table if not exists public.mentorados (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,              -- e-mail da compra (sempre minúsculo)
  nome           text,
  turma          text,                       -- ex.: 'Turma 1'
  ativo          boolean not null default true,
  observacao     text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  ultimo_acesso  timestamptz
);

-- e-mail sempre minúsculo e sem espaços nas pontas
create or replace function public.mentorados_normaliza()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(btrim(new.email));
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists mentorados_normaliza_trg on public.mentorados;
create trigger mentorados_normaliza_trg
  before insert or update on public.mentorados
  for each row execute function public.mentorados_normaliza();

-- um e-mail só pode aparecer uma vez
create unique index if not exists mentorados_email_uniq on public.mentorados (email);
create index if not exists mentorados_ativo_idx on public.mentorados (ativo);

-- 2) Registro de acessos (quem entrou e o que abriu) ------------------
create table if not exists public.acessos (
  id          bigint generated always as identity primary key,
  email       text not null,
  evento      text not null,                 -- 'login', 'ferramenta', 'workflow'
  detalhe     text,                          -- ex.: nome da ferramenta
  criado_em   timestamptz not null default now()
);
create index if not exists acessos_email_idx on public.acessos (email, criado_em desc);
create index if not exists acessos_criado_idx on public.acessos (criado_em desc);

-- 3) Segurança (RLS) --------------------------------------------------
-- Nenhuma das duas tabelas fica aberta para o público.
alter table public.mentorados enable row level security;
alter table public.acessos    enable row level security;

revoke all on public.mentorados from anon;
revoke all on public.acessos    from anon;
revoke all on public.acessos    from authenticated;

-- Quem já entrou só consegue ler o PRÓPRIO registro em "mentorados".
drop policy if exists "mentorado le o proprio registro" on public.mentorados;
create policy "mentorado le o proprio registro"
  on public.mentorados
  for select
  to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

grant select on public.mentorados to authenticated;

-- (O site usa a chave "service_role" apenas no servidor para checar se o
--  e-mail está liberado ANTES de enviar o código e para gravar em "acessos".
--  Essa chave ignora o RLS e nunca vai para o navegador.)

-- =====================================================================
-- COMO USAR NO DIA A DIA (rode quando precisar)
-- =====================================================================
-- Liberar um mentorado:
--   insert into public.mentorados (email, nome, turma)
--   values ('fulano@email.com', 'Fulano de Tal', 'Turma 1')
--   on conflict (email) do update set ativo = true, nome = excluded.nome;
--
-- Cortar o acesso (vale na hora, mesmo para quem já está logado):
--   update public.mentorados set ativo = false where email = 'fulano@email.com';
--
-- Ver quantos estão ativos:
--   select count(*) from public.mentorados where ativo;
--
-- Últimos acessos:
--   select email, evento, detalhe, criado_em
--   from public.acessos order by criado_em desc limit 100;
