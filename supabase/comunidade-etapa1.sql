-- =====================================================================
-- DOMINION MENTORY | Etapa 1: admins, módulos, ferramentas e avisos
-- Cole TUDO no Supabase: SQL Editor > New query > Run.
-- Pode rodar de novo sem problema (não duplica nada).
-- =====================================================================

-- 1) Admins ------------------------------------------------------------
create table if not exists public.admins (
  email      text primary key,
  criado_em  timestamptz not null default now()
);

insert into public.admins (email) values
  ('higormachado.designer@gmail.com'),
  ('stellapmkt@gmail.com'),
  ('dominion.mentory@gmail.com')
on conflict (email) do nothing;

-- 2) Módulos (os grupos do painel) --------------------------------------
create table if not exists public.modulos (
  id         uuid primary key default gen_random_uuid(),
  titulo     text not null,
  cor        text not null default 'op' check (cor in ('op','calc','ia','aula')),
  ordem      int  not null default 0,
  visivel    boolean not null default true,
  criado_em  timestamptz not null default now()
);

-- 3) Ferramentas (os cards) ---------------------------------------------
create table if not exists public.itens (
  id         uuid primary key default gen_random_uuid(),
  modulo_id  uuid not null references public.modulos(id) on delete cascade,
  titulo     text not null,
  descricao  text not null default '',
  tag        text not null default '',
  icone      text not null default 'grid',
  url        text not null,
  destaque   boolean not null default false,   -- card grande "Comece aqui"
  ordem      int  not null default 0,
  visivel    boolean not null default true,
  criado_em  timestamptz not null default now()
);
create index if not exists itens_modulo_idx on public.itens (modulo_id, ordem);

-- 4) Avisos (faixa em destaque no topo do painel) -----------------------
create table if not exists public.avisos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  texto       text not null default '',
  tipo        text not null default 'info' check (tipo in ('info','importante','urgente')),
  link_url    text,
  link_texto  text,
  ativo       boolean not null default true,
  expira_em   timestamptz,
  criado_em   timestamptz not null default now()
);
create index if not exists avisos_ativo_idx on public.avisos (ativo, criado_em desc);

-- 5) Segurança: ninguém de fora lê ou escreve; só o servidor (service_role) -
alter table public.admins  enable row level security;
alter table public.modulos enable row level security;
alter table public.itens   enable row level security;
alter table public.avisos  enable row level security;
revoke all on public.admins, public.modulos, public.itens, public.avisos from anon, authenticated;

-- 6) Conteúdo atual do painel (só entra se ainda não existir nenhum módulo) -
do $$
declare
  m_inicio uuid; m_op uuid; m_aula uuid; m_calc uuid; m_ia uuid;
begin
  if exists (select 1 from public.modulos) then
    return;
  end if;

  insert into public.modulos (titulo, cor, ordem, visivel) values ('Início', 'aula', 0, true) returning id into m_inicio;
  insert into public.modulos (titulo, cor, ordem) values ('Operação', 'op', 10) returning id into m_op;
  insert into public.modulos (titulo, cor, ordem) values ('Método e aulas', 'aula', 20) returning id into m_aula;
  insert into public.modulos (titulo, cor, ordem) values ('Saúde e análise da conta', 'calc', 30) returning id into m_calc;
  insert into public.modulos (titulo, cor, ordem) values ('Criativos com IA', 'ia', 40) returning id into m_ia;

  insert into public.itens (modulo_id, titulo, descricao, tag, icone, url, destaque, ordem) values
    (m_inicio, 'Mapa de Estudos', 'Por onde eu começo? Todo mundo parte do mesmo ponto e a rota muda conforme o seu nível.', 'Comece aqui', 'layers', 'https://claude.ai/artifact/VahhJ4w4XDkwbkMTM9QL2Z', true, 10),

    (m_op, 'Operação Multicontas', 'Planeje a produção e monte o mapa de postagens dos 7 dias para todas as contas, com tudo em uma planilha.', 'Planejamento', 'grid', 'https://claude.ai/artifact/7xi6kPf9TvTH5fngLZyTu3', false, 10),

    (m_aula, 'Modelo SAL', 'Método exclusivo: Segmentar, Atingir e Lateralizar. Uma conta, um nicho, validar e escalar para os lados.', 'Método', 'layers', 'https://claude.ai/artifact/L6q58zQvnQFDyHFq9MhnLk', false, 10),
    (m_aula, 'Resumo das Calls', 'Resumo de cada call com o Higor: métricas, planos por faixa, dúvidas respondidas e checklist de ações.', 'Aula', 'chart', 'https://resumos-calls.vercel.app/', false, 20),
    (m_aula, 'Calendário Dominion', 'Das primeiras calls até a virada de formato, com o que falar em cada marco e a Dominion Race.', 'Calendário', 'grid', 'https://claude.ai/artifact/PnGLHRZrXfvDB9JgUAKm5T', false, 30),

    (m_calc, 'Pontos da Conta', 'Como funciona a pontuação de cada conta de criador, os marcos e as restrições, sem susto.', 'Guia', 'gauge', 'https://claude.ai/artifact/D5RN8ocfLt6iM3TNQwkmQ8', false, 10),
    (m_calc, 'Análise de Conta', 'Média por 1.000 impressões: descubra se a conta está boa, média ou ruim com cliques por venda.', 'Análise', 'chart', 'https://claude.ai/artifact/DXAJBD37R1NFCAva2je1uv', false, 20),
    (m_calc, 'Calculadora de Retorno', 'Em quanto tempo o TikTok Shop paga a sua operação: ponto de equilíbrio e meses para o investimento voltar.', 'Calculadora', 'calc', 'https://claude.ai/artifact/S1J1XxZV2UwR3r88Kudr7M', false, 30),

    (m_ia, 'POV Perfume Árabe', '5 cenários prontos para gerar a imagem vertical 9:16 e depois animar em vídeo.', 'Prompts', 'bag', 'https://claude.ai/artifact/N6XbMZkK6MsBw1H13brqnz', false, 10),
    (m_ia, 'POV Show Case · Cabide', 'Frame do produto mais um prompt de movimento para o gerador de vídeo.', 'Prompts', 'hanger', 'https://claude.ai/artifact/QGd3p9MLo2fiRMceoQ6zRR', false, 20),
    (m_ia, 'UGC Try-On · Cenários Brasileiros', 'Imagens que parecem registros pessoais feitos em ambientes comuns. Versões A e B.', 'Prompts', 'user', 'https://claude.ai/artifact/QyPMB9tN5hUtCMsm23AZD9', false, 30),
    (m_ia, 'Identidade da Loja', 'Nome, logo e vitrine para a loja não ficar presa a um nicho só.', 'Guia', 'tag', 'https://claude.ai/artifact/CyJazGJz6cScDwbqRrT4YU', false, 40);
end $$;
