-- =====================================================================
-- DOMINION MENTORY | Etapa 7: cada postagem pertence a um lugar (uma página)
-- Rode DEPOIS das etapas anteriores. Cole no SQL Editor e clique em Run.
-- Pode rodar de novo sem problema.
-- As postagens que já existem continuam em "Novidades".
-- =====================================================================

-- 1) A página (slug) onde a postagem foi publicada. Vazio = Novidades.
alter table public.posts add column if not exists pagina_slug text;
create index if not exists posts_pagina_idx on public.posts (pagina_slug);

-- 2) Feed em UMA consulta, agora com filtro de página ---------------------
--    (a versão antiga, de 5 parâmetros, sai para não haver duas funções com o mesmo nome)
drop function if exists public.feed_posts(text, int, boolean, boolean, boolean);

create or replace function public.feed_posts(
  p_email            text,
  p_limite           int     default 30,
  p_so_fixados       boolean default false,
  p_fixados_primeiro boolean default true,
  p_rascunhos        boolean default false,
  p_pagina           text    default null,   -- só as postagens desta página
  p_incluir_novidades boolean default false  -- junto com as sem página (Novidades)
)
returns table (
  id uuid, titulo text, corpo text, imagem_url text, formato text,
  fixado boolean, publicado boolean, autor_nome text, autor_usuario text,
  criado_em timestamptz, curtidas bigint, comentarios bigint, eu_curti boolean, aviso_tipo text,
  pagina_slug text
)
language sql
stable
as $$
  select p.id, p.titulo, p.corpo, p.imagem_url, p.formato,
         p.fixado, p.publicado, p.autor_nome, p.autor_usuario, p.criado_em,
         (select count(*) from public.curtidas c where c.post_id = p.id),
         (select count(*) from public.comentarios k where k.post_id = p.id),
         exists (select 1 from public.curtidas c where c.post_id = p.id and c.email = p_email),
         (select a.tipo from public.avisos a where a.post_id = p.id limit 1),
         p.pagina_slug
  from public.posts p
  where (p.publicado or p_rascunhos)
    and (not p_so_fixados or p.fixado)
    and (p_pagina is null
         or p.pagina_slug = p_pagina
         or (p_incluir_novidades and p.pagina_slug is null))
  order by (case when p_fixados_primeiro then p.fixado else false end) desc, p.criado_em desc
  limit p_limite
$$;

revoke all on function public.feed_posts(text, int, boolean, boolean, boolean, text, boolean) from public, anon, authenticated;
grant execute on function public.feed_posts(text, int, boolean, boolean, boolean, text, boolean) to service_role;

-- 3) Avisos que já foram criados a partir de postagens passam a levar a imagem da postagem ---
update public.avisos a
   set imagem_url = p.imagem_url
  from public.posts p
 where a.post_id = p.id
   and a.imagem_url is null
   and p.imagem_url is not null;
