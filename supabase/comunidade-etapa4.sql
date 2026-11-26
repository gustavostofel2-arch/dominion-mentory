-- =====================================================================
-- DOMINION MENTORY | Etapa 4: @ dos alunos, respostas, post vira aviso, feed rápido
-- Rode DEPOIS das etapas 1, 2 e 3. Cole tudo no SQL Editor e clique em Run.
-- Pode rodar de novo sem problema.
-- =====================================================================

-- 1) Perfis: o @ de cada pessoa (único, sem repetir, ignora maiúsculas) ----
create table if not exists public.perfis (
  email      text primary key,
  usuario    text not null,
  criado_em  timestamptz not null default now(),
  constraint perfis_usuario_formato check (usuario ~ '^[a-z0-9._]{3,20}$')
);
create unique index if not exists perfis_usuario_uniq on public.perfis (lower(usuario));

-- 2) Guardar o @ junto das postagens e dos comentários --------------------
alter table public.posts       add column if not exists autor_usuario text;
alter table public.comentarios add column if not exists usuario text;

-- 3) Respostas aos comentários -------------------------------------------
alter table public.comentarios
  add column if not exists parent_id uuid references public.comentarios(id) on delete cascade;
create index if not exists comentarios_parent_idx on public.comentarios (parent_id);

-- 4) Aviso criado a partir de uma postagem --------------------------------
alter table public.avisos
  add column if not exists post_id uuid references public.posts(id) on delete cascade;
create unique index if not exists avisos_post_uniq on public.avisos (post_id) where post_id is not null;

-- 5) Feed em UMA consulta (posts + curtidas + comentários + se eu curti) ---
create or replace function public.feed_posts(
  p_email      text,
  p_limite     int     default 30,
  p_so_fixados boolean default false,
  p_fixados_primeiro boolean default true,
  p_rascunhos  boolean default false
)
returns table (
  id uuid, titulo text, corpo text, imagem_url text, formato text,
  fixado boolean, publicado boolean, autor_nome text, autor_usuario text,
  criado_em timestamptz, curtidas bigint, comentarios bigint, eu_curti boolean, aviso_tipo text
)
language sql
stable
as $$
  select p.id, p.titulo, p.corpo, p.imagem_url, p.formato,
         p.fixado, p.publicado, p.autor_nome, p.autor_usuario, p.criado_em,
         (select count(*) from public.curtidas c where c.post_id = p.id),
         (select count(*) from public.comentarios k where k.post_id = p.id),
         exists (select 1 from public.curtidas c where c.post_id = p.id and c.email = p_email),
         (select a.tipo from public.avisos a where a.post_id = p.id limit 1)
  from public.posts p
  where (p.publicado or p_rascunhos)
    and (not p_so_fixados or p.fixado)
  order by (case when p_fixados_primeiro then p.fixado else false end) desc, p.criado_em desc
  limit p_limite
$$;

revoke all on function public.feed_posts(text, int, boolean, boolean, boolean) from public, anon, authenticated;
grant execute on function public.feed_posts(text, int, boolean, boolean, boolean) to service_role;

-- 6) Segurança --------------------------------------------------------------
alter table public.perfis enable row level security;
revoke all on public.perfis from anon, authenticated;
