# Dominion Mentory

Site da Dominion Mentory em Next.js, com login só pelo e-mail da compra para os mentorados.

- **Público:** página inicial (`/`) com a mentoria, o mentor, a Dominion Race e o botão "Acessar sistema".
- **Restrito a mentorados ativos:** painel (`/painel`), ferramentas (`/ferramentas/*`) e as imagens das aulas (`/img/*`, exceto logo e foto do mentor). Os workflows ficam dentro do Dominion Flow, não neste site.

## Contas e onde cada coisa roda

| Serviço | Conta | Para quê |
|---|---|---|
| Supabase | `dominion.mentory@gmail.com` | Banco (tabelas `mentorados` e `acessos`) e autenticação |
| Vercel | `gustavostofel2@gmail.com` | Hospedagem do site |
| GitHub | `gustavostofel2-arch/dominion-mentory` (privado) | Código |

As chaves do Supabase ficam só nas variáveis de ambiente da Vercel. Nunca colocar no GitHub.

## Como o acesso funciona

1. A pessoa digita o e-mail da compra em `/login`.
2. O servidor confere se o e-mail está na tabela `mentorados` com `ativo = true`. Se não estiver, não entra.
3. Estando liberado, o servidor cria a sessão na hora. **Não envia e-mail, código nem link.**
4. O servidor guarda um cookie assinado (`dm_ok`) dizendo que o e-mail foi conferido, e **só consulta o Supabase de novo a cada 5 minutos**. Isso deixa as páginas e as imagens rápidas. Desativar um mentorado corta o acesso em até 5 minutos, mesmo para quem já está logado. (O tempo muda com a variável opcional `SESSAO_TTL_S`, em segundos.)

As ferramentas e as imagens das aulas são **arquivos estáticos** em `public/` (rápidos, servidos pela CDN da Vercel). O `middleware.ts` roda na borda **antes** de entregar qualquer um deles e barra quem não estiver liberado. Depois de publicar, confirme abrindo uma imagem restrita em janela anônima: deve dar "Acesso restrito" (401) ou ir para o login.

## Configurar (uma vez)

### 1. Supabase

1. Rode o arquivo [`supabase/schema.sql`](supabase/schema.sql) no **SQL Editor** do Supabase.
2. **Project Settings > API**: copie a URL, a chave `anon` e a chave `service_role`.

### 2. Variáveis de ambiente (Vercel > Settings > Environment Variables)

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave `service_role` (**secreta**) |

A `service_role` só é usada no servidor. Nunca coloque no GitHub nem com o prefixo `NEXT_PUBLIC_`.

### 3. Vercel

- **Settings > Build & Development > Framework Preset: Next.js** (o projeto antigo era HTML estático e pode estar como "Other").
- Faça o deploy.

## Liberar e cortar mentorados

```sql
-- liberar
insert into public.mentorados (email, nome, turma)
values ('fulano@email.com', 'Fulano de Tal', 'Turma 1')
on conflict (email) do update set ativo = true, nome = excluded.nome;

-- cortar o acesso
update public.mentorados set ativo = false where email = 'fulano@email.com';
```

Não é preciso configurar templates de e-mail nem SMTP: o login não envia e-mail.

Também dá para importar uma planilha CSV pelo **Table Editor > mentorados > Import data from CSV** (colunas: `email`, `nome`, `turma`, `ativo`).

## Rodar local

```bash
cp .env.example .env.local   # e preencha
npm install
npm run dev
```

## Estrutura

```
app/page.tsx            página inicial pública
app/login/              login só com o e-mail (server action)
app/painel/             painel dos mentorados (restrito, página estática)
lib/sessao.ts           cookie assinado de acesso conferido
lib/supabase/           clientes do Supabase
middleware.ts           O PORTEIRO: roda antes de qualquer página ou arquivo restrito
public/ferramentas/     as ferramentas (HTML estático, restrito pelo porteiro)
public/img/             imagens das aulas (restritas pelo porteiro); logo.png e higor.webp são públicas
supabase/schema.sql     tabelas e regras de segurança
```
