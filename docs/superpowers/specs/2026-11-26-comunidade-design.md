# Dominion Mentory — Comunidade, Admin e Notificações (design)

Data: 26/11/2026. Status: aguardando aprovação do dono.

## Intenção
Transformar o painel dos mentorados em uma **comunidade**: tudo editável por admins (sem mexer em código), com menu lateral, busca, um feed de novidades e notificações push (inclusive agendadas). Hoje o conteúdo está fixo em `lib/conteudo.ts` e cada mudança exige deploy.

## Metas
- Admins (lista de e-mails) veem uma área **Admin** que os alunos não veem.
- No Admin: criar, editar, ordenar e esconder **módulos** (grupos) e **ferramentas** (nome, descrição, tag, ícone, link, botão "Abrir").
- Menu lateral, que no celular vira barra inferior ou gaveta: Início, Ferramentas, Resumos, Dominion Flow, Race, Regras, Feed.
- **Busca** em ferramentas e posts.
- **Feed**: só admin posta (título, negrito, emojis, links e imagem opcional). Aluno curte e comenta.
- **Notificações**: push do navegador, enviadas na hora ou agendadas, mais um **sino** dentro do painel.
- Funcionar em computador e celular (PWA instalável).

## Não metas
- Aluno postar no feed, mensagens diretas, imagens em comentários.
- Trocar o login (continua só com o e-mail da compra) ou o visual (cores e fontes ficam).
- Editar Race e Regras pelo Admin (ficam no código na 1ª versão).
- Rastrear cliques nas ferramentas externas (já não existe desde a troca para links).

## Restrições
- Stack atual: Next.js 15 + Supabase (service role só no servidor) + Vercel. Continua assim.
- iPhone só recebe push com o site instalado na tela inicial (iOS 16.4+). Android e computador recebem direto.
- Vercel Cron por minuto exige plano **Pro** (a confirmar). No Hobby, o disparo muda para `pg_cron`.
- Imagens ocupam o Storage do Supabase: comprimir no envio (WebP, ~300 KB) para não encher o banco.

## Abordagens consideradas
1. **Tudo no próprio site (escolhida).** Conteúdo, feed e push no Supabase. Push próprio (Web Push + VAPID), agendamento por Vercel Cron. Sem custo por envio, sem terceiros.
2. Conteúdo no próprio site + OneSignal para push. Mais rápido de ligar, mas dados e painel duplicados em outro serviço. Descartada.
3. Aproveitar WhatsApp/Telegram para avisos. Não é push do site e o WhatsApp oficial é pago. Fica como canal complementar.

Escolha do dono: push próprio. Agendamento: Vercel Cron (fallback `pg_cron`).

## Design

### Dados (Supabase, tudo com RLS; leitura/escrita via servidor)
- `admins(email)`. Admin = e-mail nesta tabela **e** mentorado ativo. Checado no servidor a cada ação do Admin (não só no cookie).
- `modulos(id, titulo, cor, ordem, visivel)` e `itens(id, modulo_id, titulo, descricao, tag, icone, url, ordem, visivel, destaque)`. `destaque` = o card "Comece aqui". Seed inicial = o conteúdo atual de `lib/conteudo.ts`.
- `posts(id, titulo, corpo, imagem_url, formato, fixado, publicado_em, autor_email)`, `curtidas(post_id, email)` e `comentarios(id, post_id, email, nome, texto, criado_em)`.
- `push_inscricoes(email, endpoint, chaves, criado_em)` e `notificacoes(id, titulo, texto, link, enviar_em, status, criada_por)` com `lidas(notificacao_id, email)` para o sino.

### Telas
- **Layout novo** (barra lateral): Início (banner + destaques), Ferramentas, Resumos, Flow, Race, Regras, Feed, e Admin (só admin).
- **Admin:** Módulos e ferramentas (listar, criar, editar, arrastar para ordenar, esconder), Feed (novo post), Notificações (enviar agora ou agendar), com histórico.
- **Feed:** banner no topo (16:9) e posts em ordem de data, com fixados no topo.
  Formatos de imagem aceitos: 1080×1080, 1080×1320 e 1920×1080.
- **Editor de post:** barra com negrito, itálico, título, link, emoji. Guarda um Markdown simples, exibido sem HTML solto (sem XSS).

### Busca
Barra no topo do painel. Ferramentas filtradas na hora, no navegador (lista pequena). Posts via consulta no servidor (`ilike`).

### Notificações
- PWA: `manifest.webmanifest`, ícones e service worker.
- Botão "Ativar notificações" + passo a passo do iPhone.
- `/api/cron/notificacoes` roda por minuto (Vercel Cron, protegido por `CRON_SECRET`), envia as agendadas vencidas com a biblioteca `web-push` e remove inscrições mortas.
- O sino mostra as últimas notificações para quem não ativou o push.

### Segurança
- Admin e ações de escrita checadas no servidor. Comentário limitado (500 caracteres), com limite de envios por minuto.
- Admin pode apagar qualquer comentário.
- Chaves VAPID e `CRON_SECRET` só em variáveis de ambiente.

## Etapas (cada uma entra em produção sozinha)
1. **Admin + ferramentas editáveis + layout lateral + busca de ferramentas.**
2. **Feed** (posts, imagens, curtidas, comentários) + busca em posts.
3. **PWA + push + sino + agendamento.**
4. Refinos: Race/Regras editáveis, métricas, moderação.

## Fica com quem constrói
Nomes de tabelas e colunas, estilo exato do editor, ordem por arrastar ou botões, textos de ajuda. Mudanças de comportamento voltam para o dono.
