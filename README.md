# Dominion Mentory

Site da Dominion Mentory em Next.js, com login por e-mail (código) para os mentorados.

- **Público:** página inicial (`/`) com a mentoria, o mentor, a Dominion Race e o botão "Acessar sistema".
- **Restrito a mentorados ativos:** painel (`/painel`), ferramentas (`/ferramentas/*`), workflows (`/dominion-flow`, `/workflows/*`) e as imagens das aulas (`/img/*`, exceto logo e foto do mentor).

## Como o acesso funciona

1. A pessoa digita o e-mail da compra em `/login`.
2. O servidor confere se o e-mail está na tabela `mentorados` com `ativo = true`. Se não estiver, **nenhum código é enviado**.
3. O Supabase envia um código de 6 dígitos por e-mail. Ao digitar, a pessoa entra.
4. **A cada acesso** a uma página ou arquivo restrito o servidor confere de novo se a pessoa continua ativa. Desativar um mentorado corta o acesso na hora, mesmo para quem já está logado.

Os arquivos das ferramentas ficam em `private/` (fora de `public/`) e só saem pelo servidor depois da checagem. Não existe URL pública que entregue esses arquivos.

## Configurar (uma vez)

### 1. Supabase

1. Rode o arquivo [`supabase/schema.sql`](supabase/schema.sql) no **SQL Editor** do Supabase.
2. **Authentication > Providers > Email**: deixe "Enable email provider" ligado. "Confirm email" pode ficar ligado.
3. **Authentication > Emails > Templates**: nos modelos **Magic Link** e **Confirm signup**, troque o corpo para mostrar o código:

   ```html
   <h2>Seu código de acesso</h2>
   <p>Use este código para entrar no sistema da Dominion Mentory:</p>
   <p style="font-size:28px;letter-spacing:6px;font-weight:bold">{{ .Token }}</p>
   <p>Ele vale por pouco tempo. Se não foi você, ignore este e-mail.</p>
   ```

   (Sem `{{ .Token }}` o e-mail leva só um link e o código não aparece.)
4. **Authentication > Emails > SMTP Settings**: configure um SMTP próprio (Resend, Brevo etc.). O envio padrão do Supabase serve só para teste e tem limite muito baixo de e-mails por hora.
5. **Project Settings > API**: copie a URL, a chave `anon` e a chave `service_role`.

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
app/login/              login por e-mail + código (server actions)
app/painel/             painel dos mentorados (restrito)
app/dominion-flow/      workflows para baixar (restrito)
app/ferramentas/[slug]/ serve os HTMLs de private/ferramentas (restrito)
app/img/[file]/         serve as imagens de private/img (restrito)
app/workflows/[file]/   serve os .json de private/workflows (restrito)
lib/acesso.ts           checagem de mentorado ativo
lib/supabase/           clientes do Supabase
middleware.ts           renova a sessão e barra quem não entrou
private/                ferramentas, imagens e workflows (não públicos)
public/img/             só logo e foto do mentor
supabase/schema.sql     tabelas e regras de segurança
```
