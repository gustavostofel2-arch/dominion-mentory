import { markdownParaDoc } from "@/lib/markdown";
import { FLOW_URL, TURBO_FLOW_URL } from "@/lib/conteudo";
import type { Dados, TipoBloco } from "@/lib/blocos";

/**
 * As páginas que o site já tinha, agora descritas como blocos. Servem de conteúdo inicial
 * (gravado sozinho no banco na primeira visita) e de reserva se as tabelas ainda não existem.
 */

export type PaginaPadrao = {
  slug: string;
  titulo: string;
  menu_rotulo?: string;
  etiqueta?: string;
  descricao?: string;
  icone: string;
  no_menu: boolean;
  visivel: boolean;
  mostrar_cabecalho: boolean;
  protegida: boolean;
  ordem: number;
  blocos: { tipo: TipoBloco; dados: Dados }[];
};

const md = (texto: string) => JSON.stringify(markdownParaDoc(texto));
const iso = (s: string) => new Date(s).toISOString();

const REGRAS_MENTORIA = [
  {
    pergunta: "Foco no propósito do grupo",
    resposta:
      "Este espaço é exclusivo para dúvidas, trocas de experiência e conteúdos relacionados ao TikTok Shop e à mentoria Dominion Shop. Assuntos fora desse escopo devem ser evitados.",
  },
  {
    pergunta: "Proibido falar mal de outros players, comunidades ou cursos",
    selo: "Regra rígida",
    resposta:
      "É **terminantemente proibido** criticar, difamar ou expor negativamente outros mentores, comunidades, cursos ou concorrentes do mercado, seja dentro do grupo ou em qualquer outro espaço associado à mentoria.\n\nO mercado é livre, e cada player tem seu próprio caminho e método. Aqui, nosso foco é entregar o nosso melhor e o nosso diferencial, não desmerecer o trabalho dos outros. Respeito ao mercado é respeito à nossa própria imagem.\n\nDescumprimento desta regra pode resultar em **remoção imediata** do grupo, independente de advertências anteriores.",
  },
  {
    pergunta: "Proibido falar sobre política, religião ou assuntos polêmicos",
    resposta:
      "Não é permitido debater política, religião ou qualquer tema que não tenha relação com a mentoria. O grupo é um ambiente neutro e profissional.",
  },
  {
    pergunta: "Respeito acima de tudo",
    resposta:
      "Trate todos os membros e mentores com respeito e educação. Não serão tolerados:\n\n- Ofensas, xingamentos ou ironias com outros alunos\n- Preconceito de qualquer tipo (racial, religioso, de gênero, etc.)\n- Deboche com dúvidas de outros alunos. Todo mundo já foi iniciante",
  },
  {
    pergunta: "Faça perguntas claras e objetivas",
    resposta:
      "Aqui não existe pergunta “boba”, mas existe pergunta mal formulada. Para que possamos te ajudar da melhor forma e mais rápido, siga a estrutura abaixo. Isso facilita a vida de quem vai responder e ajuda todo mundo que tiver a mesma dúvida no futuro.\n\n## Estrutura padrão\n\nAssunto: (escolha a categoria da sua dúvida)\nDúvida: (explique de forma clara, direta e com detalhes)\n\n**Categorias:** Farm de contas · Mineração de produtos · Validação de produto · Escala de vídeos · Estrutura de testes · Criação de vídeos com IA · Edição/qualidade de vídeo · Copy e legendas · Métricas e desempenho · Pagamentos/afiliados · Live com IA · Outros\n\n## Como perguntar certo\n\nAssunto: Estrutura de testes\nDúvida: Quando eu subo 3 vídeos diferentes pro mesmo produto, devo esperar quanto tempo antes de decidir qual vai continuar rodando e qual eu corto?\n\n## Evite perguntas assim\n\n“Não tá vendendo, o que eu faço?” · “Alguém pode me ajudar com conta?” · “Isso é normal?”\n\nEssas perguntas não dão contexto suficiente pra ninguém te ajudar de verdade.",
  },
  {
    pergunta: "Paciência nas respostas",
    resposta:
      "Nem sempre o mentor ou os colegas estarão online no mesmo instante. Evite cobranças excessivas ou tom de impaciência. Sua dúvida será respondida assim que possível.",
  },
  {
    pergunta: "Ajuda mútua entre alunos",
    resposta:
      "Incentivamos fortemente que alunos mais experientes ajudem os iniciantes. Essa é uma mentoria colaborativa: quem ensina, aprende ainda mais.",
  },
  {
    pergunta: "Proibido spam e autopromoção",
    resposta:
      "Não é permitido:\n\n- Divulgar outros grupos, canais, cursos ou serviços sem autorização\n- Enviar links suspeitos ou não relacionados ao tema\n- Fazer propaganda de produtos/serviços pessoais dentro do grupo",
  },
  {
    pergunta: "Sem prints ou compartilhamento do conteúdo da mentoria",
    resposta:
      "O material, as aulas e as estratégias ensinadas são exclusivos para membros. É proibido printar, gravar ou compartilhar o conteúdo fora do grupo.",
  },
  {
    pergunta: "Sem áudios longos ou correntes",
    resposta: "Evite áudios muito extensos, correntes, memes em excesso ou mensagens fora de contexto que poluam o chat.",
  },
  {
    pergunta: "Advertências e remoção",
    resposta:
      "O descumprimento das regras pode resultar em:\n\n- **1ª vez:** Advertência\n- **2ª vez:** Silenciamento temporário\n- **3ª vez:** Remoção definitiva do grupo, sem reembolso, conforme contrato da mentoria\n\nExceção: a regra rígida do item 2 pode gerar remoção imediata, sem passar pelas etapas acima.",
  },
  {
    pergunta: "Espírito de comunidade",
    resposta: "Ajude, seja ajudado, comemore as vitórias dos colegas e mantenha o ambiente leve e motivador.",
  },
];

const REGRAS_PLATAFORMA = [
  {
    pergunta: "Novidades e avisos são da equipe",
    resposta: "Só a equipe da Dominion publica avisos e novidades. Os avisos urgentes passam no topo do Início: confira ao entrar.",
  },
  {
    pergunta: "Comentários e curtidas",
    resposta: "Use os comentários para tirar dúvidas e trocar ideias sobre a postagem. Seja objetivo, educado e ajude quem está começando.",
  },
  {
    pergunta: "Sem spam, links de terceiros ou autopromoção",
    resposta: "Comentários com propaganda, links suspeitos ou divulgação de outros produtos e comunidades serão apagados.",
  },
  {
    pergunta: "Proteja os seus dados",
    resposta:
      "Nunca publique senhas, códigos de acesso ou dados pessoais seus ou de outras pessoas nos comentários. Para assuntos da sua conta, fale com a equipe.",
  },
  {
    pergunta: "A equipe pode moderar",
    resposta:
      "Comentários que desrespeitem as regras da mentoria podem ser apagados pela equipe, e o descumprimento segue as advertências da mentoria.",
  },
  {
    pergunta: "Seu @ é só seu",
    resposta: "O @ que você escolhe no primeiro acesso aparece nos seus comentários e não pode ser trocado. Não use o @ para se passar por outra pessoa ou pela equipe.",
  },
];

const faqItens = (l: { pergunta: string; resposta: string; selo?: string }[]) =>
  l.map((i) => ({ pergunta: i.pergunta, resposta: md(i.resposta), selo: i.selo ?? "" }));

export const PAGINAS_PADRAO: PaginaPadrao[] = [
  {
    slug: "inicio",
    titulo: "Início",
    icone: "home",
    no_menu: true,
    visivel: true,
    mostrar_cabecalho: false,
    protegida: true,
    ordem: 0,
    blocos: [
      { tipo: "avisos", dados: {} },
      {
        tipo: "saudacao",
        dados: {
          etiqueta: "Painel do mentorado",
          titulo: "Olá, {nome}",
          texto: "Avisos importantes no topo, as novidades da equipe logo abaixo e as ferramentas da mentoria a um toque.",
        },
      },
      {
        tipo: "corrida",
        dados: {
          variante: "resumo",
          etiqueta: "Turma 1 · 01/11 a 30/11",
          titulo: "Dominion Race",
          texto: "",
          inicio: iso("2026-11-01T00:00:00-03:00"),
          fim: iso("2026-11-30T23:59:59-03:00"),
          prazo: iso("2026-12-02T23:59:59-03:00"),
          prazo_rotulo: "Prazo máximo de envio",
          contagem: true,
          premios: [],
          link_texto: "Ver a corrida",
          link_url: "/painel/race",
        },
      },
      {
        tipo: "feed",
        dados: { titulo: "Novidades da equipe", modo: "pagina" },
      },
      {
        tipo: "ferramentas",
        dados: {
          titulo: "Comece por aqui",
          mostrar: "destaques",
          modulo: "todos",
        },
      },
      {
        tipo: "cartoes",
        dados: {
          titulo: "",
          colunas: "3",
          estilo: "padrao",
          itens: [
            { icone: "grid", etiqueta: "", titulo: "Ferramentas e aulas", texto: "Calculadoras, guias e prompts", url: "/painel/ferramentas", botao: "Abrir" },
            { icone: "bolt", etiqueta: "", titulo: "Dominion Flow", texto: "Workflows do Google Flow", url: "/painel/flow", botao: "Abrir" },
            { icone: "book", etiqueta: "", titulo: "Regras", texto: "Mentoria e comunidade", url: "/painel/regras", botao: "Abrir" },
          ],
        },
      },
    ],
  },
  {
    slug: "novidades",
    titulo: "Novidades",
    etiqueta: "Comunidade",
    descricao: "Aulas novas, novidades e conteúdos da equipe. Curta, comente e responda os colegas. Os avisos urgentes ficam no Início.",
    icone: "megaphone",
    no_menu: true,
    visivel: true,
    mostrar_cabecalho: true,
    protegida: false,
    ordem: 10,
    blocos: [{ tipo: "feed", dados: { titulo: "", modo: "pagina" } }],
  },
  {
    slug: "ferramentas",
    titulo: "Ferramentas e aulas",
    etiqueta: "Ferramentas e aulas",
    descricao: "Cada ferramenta abre em uma nova aba. Para voltar, é só fechar a aba e você continua aqui no painel. Use a busca no topo para achar mais rápido.",
    icone: "grid",
    no_menu: true,
    visivel: true,
    mostrar_cabecalho: true,
    protegida: false,
    ordem: 20,
    blocos: [{ tipo: "ferramentas", dados: { titulo: "", mostrar: "tudo", modulo: "todos", ver_todas_texto: "", ver_todas_url: "" } }],
  },
  {
    slug: "flow",
    titulo: "Dominion Flow",
    etiqueta: "Acesso dos mentorados",
    descricao: "Workflows que funcionam dentro do Google Flow para acelerar a sua produção. Quem já é mentorado já tem acesso.",
    icone: "bolt",
    no_menu: true,
    visivel: true,
    mostrar_cabecalho: true,
    protegida: false,
    ordem: 30,
    blocos: [
      {
        tipo: "cartoes",
        dados: {
          titulo: "",
          colunas: "1",
          estilo: "destaque",
          itens: [
            {
              icone: "bolt",
              etiqueta: "Plataforma",
              titulo: "Acessar o Dominion Flow",
              texto: "Os fluxos prontos ficam dentro do próprio Dominion Flow. Entre com o seu login e escolha o workflow que quer usar. Não é venda.",
              url: FLOW_URL,
              botao: "Abrir o Dominion Flow",
            },
            {
              icone: "book",
              etiqueta: "Guia",
              titulo: "Modo de uso do Flow Turbo",
              texto: "Passo a passo de como usar o Flow Turbo do começo ao fim, para você produzir mais rápido.",
              url: TURBO_FLOW_URL,
              botao: "Ver o modo de uso",
            },
          ],
        },
      },
    ],
  },
  {
    slug: "race",
    titulo: "Dominion Race",
    etiqueta: "Competição da Turma 1",
    descricao: "Pódio de faturamento e Dominion MVP. Datas, premiação e regulamento completo.",
    icone: "trophy",
    no_menu: true,
    visivel: true,
    mostrar_cabecalho: true,
    protegida: false,
    ordem: 40,
    blocos: [
      {
        tipo: "corrida",
        dados: {
          variante: "completo",
          etiqueta: "Regulamento oficial · Turma 1",
          titulo: "DOMINION RACE",
          texto:
            "A corrida da Turma 1 está oficialmente aberta! São 2 premiações acontecendo ao mesmo tempo: o pódio de faturamento e o Dominion MVP.",
          inicio: iso("2026-11-01T00:00:00-03:00"),
          fim: iso("2026-11-30T23:59:59-03:00"),
          prazo: iso("2026-12-02T23:59:59-03:00"),
          prazo_rotulo: "Prazo máximo de envio",
          contagem: true,
          premios: [
            { posicao: "1º", valor: "R$ 1.000", legenda: "em Pix" },
            { posicao: "2º", valor: "R$ 500", legenda: "em Pix" },
            { posicao: "3º", valor: "R$ 200", legenda: "em Pix" },
          ],
          link_texto: "",
          link_url: "",
        },
      },
      {
        tipo: "texto",
        dados: {
          estilo: "caixa",
          corpo: md(
            "## Parte 1 · Pódio de faturamento\n\nOs alunos competem para faturar o máximo possível no TikTok Shop. Não importa com quantas contas você trabalha: vale somar o GMV de **quantas contas você tiver**. O faturamento é acumulativo durante todo o período.\n\n**Envie o total de faturamento no grupo até 02/12.** Depois dessa data, nenhuma comprovação será aceita e você fica fora da disputa do pódio.",
          ),
        },
      },
      {
        tipo: "texto",
        dados: {
          estilo: "caixa",
          corpo: md(
            "## Onde e como postar\n\n- Todas as postagens exclusivamente no tópico **Dominion Race** do grupo oficial da turma no Telegram.\n- **Print/vídeo:** tela do total de GMV faturado, com o filtro de datas de **01/11 a 30/11**.\n- **Relato da jornada:** junto com o print, conte sua trajetória, o que achou da mentoria, o que evoluiu e deixe seu depoimento.\n- **Auditoria:** a equipe pode pedir vídeos ou imagens adicionais da tela do seu celular para validar os resultados.\n- **Identificação:** no final, informe seu **nome completo** e o **e-mail de compra** da mentoria.",
          ),
        },
      },
      {
        tipo: "texto",
        dados: {
          estilo: "caixa",
          corpo: md(
            "## Não serão aceitos\n\n- Envios após 02/12\n- Prints cortados\n- Prints sem o filtro de data correto\n- Envios sem o relato da jornada\n- Envios apenas com texto",
          ),
        },
      },
      {
        tipo: "texto",
        dados: {
          estilo: "caixa",
          corpo: md(
            "## Parte 3 · Regras gerais e apuração\n\n- O ranking será atualizado pela administração.\n- A participação é automática para todos os alunos da Turma 1.\n- É vedada a manipulação de dados, uso de contas de terceiros ou qualquer forma de fraude. Em caso de suspeita, a desclassificação pode ocorrer sem aviso prévio.\n- A administração pode solicitar comprovação adicional em caso de dúvida.\n- O resultado será anunciado na live de encerramento.\n- O Pix será pago em até 48 horas após a apuração final.",
          ),
        },
      },
      {
        tipo: "texto",
        dados: {
          estilo: "destaque",
          corpo: md(
            "## Parte 2 · Dominion MVP\n\nO prêmio para o aluno mais ativo, constante e colaborativo do grupo. O jogo aqui é na trincheira: ganha quem mais interagir, ajudar os outros mentorados com dúvidas e agregar valor de verdade. O engajamento é monitorado de forma automática pelo nosso sistema, de olho em todas as mensagens e interações.\n\n**Prêmio:** surpresa + reconhecimento oficial.",
          ),
        },
      },
      { tipo: "titulo", dados: { texto: "Bora pra cima! Vence quem mais executa.", subtitulo: "", alinhamento: "centro" } },
    ],
  },
  {
    slug: "regras",
    titulo: "Regras da mentoria e da comunidade",
    menu_rotulo: "Regras",
    etiqueta: "Comunidade",
    descricao: "Para mantermos um ambiente saudável, produtivo e focado em resultados. Elas existem para proteger o seu aprendizado e o de todos os membros.",
    icone: "book",
    no_menu: true,
    visivel: true,
    mostrar_cabecalho: true,
    protegida: false,
    ordem: 50,
    blocos: [
      { tipo: "faq", dados: { titulo: "Mentoria Dominion Shop", numerar: true, itens: faqItens(REGRAS_MENTORIA) } },
      { tipo: "faq", dados: { titulo: "Aqui na plataforma", numerar: true, itens: faqItens(REGRAS_PLATAFORMA) } },
    ],
  },
];
