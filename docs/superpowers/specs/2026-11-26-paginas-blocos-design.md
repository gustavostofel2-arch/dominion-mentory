# Dominion Mentory — Páginas e blocos personalizáveis (design)

Data: 26/11/2026. Status: aprovado pelo dono ("pode fazer").

## Intenção
O dono (e os admins) precisam mudar o painel sem pedir código: criar, renomear, reordenar e apagar abas do menu, e montar o conteúdo de cada aba com blocos (texto, imagem com texto, perguntas e respostas, ferramentas, postagens, avisos, corrida…). Hoje o menu e o formato de cada página estão fixos no código.

## Metas
- Menu lateral vem do banco: criar, renomear, trocar ícone, reordenar, esconder e apagar abas.
- Cada aba é uma lista de blocos; o admin adiciona, edita, move, duplica, oculta e exclui blocos **na própria página** (botão "Editar página").
- Páginas atuais (Início, Novidades, Ferramentas, Dominion Flow, Dominion Race, Regras) passam a ser páginas de blocos, com o mesmo conteúdo de hoje.
- Regras podem virar texto, imagem com texto, perguntas e respostas ou qualquer mistura.
- Funciona em computador e celular.

## Não metas
- HTML ou código livre dentro dos blocos (segurança).
- Abas diferentes por turma ou por pessoa.
- Arrastar e soltar (nesta versão: botões subir/descer).

## Restrições
- Stack atual: Next.js 15 + Supabase + Vercel. Escrita sempre pelo servidor, só admin.
- Sem as tabelas novas no banco, o site continua funcionando com as páginas padrão embutidas no código (somente leitura).
- Só o Início fica protegido (editável, não apagável).

## Abordagens
1. **Construtor de páginas com blocos no banco (escolhida).** Tabelas `paginas` e `blocos` (conteúdo em JSON). Um renderizador por tipo de bloco e um formulário gerado a partir de um esquema de campos.
2. Páginas fixas em código com opções ligar/desligar. Descartada: não deixa criar abas nem mudar o formato.
3. CMS externo (Notion, Sanity). Descartada: segundo painel, custo e login separados.

## Desenho
**Dados**
- `paginas(id, slug único, titulo, etiqueta, descricao, icone, no_menu, visivel, mostrar_cabecalho, ordem, protegida)`.
- `blocos(id, pagina_id → paginas ON DELETE CASCADE, tipo, dados jsonb, ordem, visivel)`; índice (pagina_id, ordem).
- RLS ligada, só o servidor (service_role) lê e escreve.

**Rotas**
- Início continua em `/painel` (página `inicio`); as demais em `/painel/{slug}` (rota dinâmica). Reservados: `admin`, `notificacoes`. A postagem individual segue em `/painel/novidades/{id}`.

**Tipos de bloco** (esquema de campos compartilhado entre formulário e validação):
saudação, título de seção, texto (normal, caixa ou destaque), imagem, imagem com texto (topo, esquerda, direita, fundo), perguntas e respostas, cartões/links (padrão ou destaque), botões, ferramentas (um módulo ou todos), postagens (feed), avisos (carrossel), corrida (datas, contagem, pódio com prêmios), separador.

**Edição**
- `?editar=1` (só admin): cada bloco ganha moldura com ⋯ (Editar, Subir, Descer, Duplicar, Ocultar, Excluir) e botões "+ Adicionar bloco" entre eles.
- Formulário do bloco é gerado do esquema (campos de texto, texto rico, imagem com recorte, lista repetível, seleção, data, sim/não). Envia um único JSON; o servidor valida e limpa cada campo (tamanhos, links http/https, texto rico só com estilos permitidos).
- Imagens: recorte no navegador e envio imediato ao Supabase Storage.

**Menu e páginas (Admin)**: criar página (em branco ou modelo), renomear, ícone, descrição, mostrar no menu, esconder, reordenar, apagar, "Editar conteúdo".

**Padrões embutidos**: as páginas atuais ficam definidas em código (`paginas-padrao`), usadas (a) como conteúdo inicial gravado automaticamente quando a tabela está vazia e (b) como reserva se a tabela não existir.

**Desempenho**: páginas e blocos em cache (tag `paginas`), limpo ao salvar; texto rico renderizado no servidor.

## Fica com quem constrói
Aparência exata dos blocos, textos de ajuda, ícones disponíveis, ordem dos campos nos formulários.
