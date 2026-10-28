export const WHATSAPP =
  "https://chat.whatsapp.com/IbydfIQ5SPl7SYL7EankCv?s=cl&p=i&mlu=4&ilr=4&iam=2";
export const TIKTOK = "https://www.tiktok.com/@higor.prompt?_r=1&_t=ZS-9AuzUVuy2Dc";
export const FLOW_URL = "https://dominion-flow.app/login";

export type Ferramenta = { slug: string; nome: string; texto: string; icone: string; tag: string };
export type Grupo = { titulo: string; classe: "op" | "calc" | "ia" | "aula"; itens: Ferramenta[] };

export const GRUPOS: Grupo[] = [
  {
    titulo: "Operação",
    classe: "op",
    itens: [
      {
        slug: "operacao-multicontas",
        nome: "Operação Multicontas",
        texto:
          "Planeje a produção e monte o mapa de postagens dos 7 dias para todas as contas, com tudo em uma planilha.",
        icone: "grid",
        tag: "Planejamento",
      },
    ],
  },
  {
    titulo: "Método e aulas",
    classe: "aula",
    itens: [
      {
        slug: "modelo-sal",
        nome: "Modelo SAL",
        texto:
          "Método exclusivo: Segmentar, Atingir e Lateralizar. Uma conta, um nicho, validar e escalar para os lados.",
        icone: "layers",
        tag: "Método",
      },
      {
        slug: "resumo-call-26-10",
        nome: "Resumo da Call · 26/10/2026",
        texto:
          "Análise de contas com o Higor: métricas, planos por faixa, dúvidas respondidas e checklist de ações.",
        icone: "chart",
        tag: "Aula",
      },
    ],
  },
  {
    titulo: "Saúde e análise da conta",
    classe: "calc",
    itens: [
      {
        slug: "pontos-da-conta",
        nome: "Pontos da Conta",
        texto: "Como funciona a pontuação de cada conta de criador, os marcos e as restrições, sem susto.",
        icone: "gauge",
        tag: "Guia",
      },
      {
        slug: "analise-de-conta",
        nome: "Análise de Conta",
        texto: "Média por 1.000 impressões: descubra se a conta está boa, média ou ruim com cliques por venda.",
        icone: "chart",
        tag: "Análise",
      },
      {
        slug: "calculadora-de-retorno",
        nome: "Calculadora de Retorno",
        texto: "Em quanto tempo o TikTok Shop paga a sua operação: ponto de equilíbrio e meses para o investimento voltar.",
        icone: "calc",
        tag: "Calculadora",
      },
    ],
  },
  {
    titulo: "Criativos com IA",
    classe: "ia",
    itens: [
      {
        slug: "pov-perfume-arabe",
        nome: "POV Perfume Árabe",
        texto: "5 cenários prontos para gerar a imagem vertical 9:16 e depois animar em vídeo.",
        icone: "bag",
        tag: "Prompts",
      },
      {
        slug: "pov-showcase-cabide",
        nome: "POV Show Case · Cabide",
        texto: "Frame do produto mais um prompt de movimento para o gerador de vídeo.",
        icone: "hanger",
        tag: "Prompts",
      },
      {
        slug: "ugc-try-on",
        nome: "UGC Try-On · Cenários Brasileiros",
        texto: "Imagens que parecem registros pessoais feitos em ambientes comuns. Versões A e B.",
        icone: "user",
        tag: "Prompts",
      },
      {
        slug: "identidade-da-loja",
        nome: "Identidade da Loja",
        texto: "Nome, logo e vitrine para a loja não ficar presa a um nicho só.",
        icone: "tag",
        tag: "Guia",
      },
    ],
  },
];

export const TOTAL_FERRAMENTAS = GRUPOS.reduce((n, g) => n + g.itens.length, 0) + 1; // + Mapa de Estudos

export const ICONES: Record<string, string> = {
  grid: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17.5 12 22l9-4.5"/>',
  calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4"/>',
  gauge: '<path d="M4 18a9 9 0 1 1 16 0"/><path d="m12 14 4-5"/><circle cx="12" cy="14" r="1.2"/>',
  chart: '<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  hanger: '<path d="M12 7a2 2 0 1 0-2-2M12 7v3l9 6a1.5 1.5 0 0 1-.8 2.7H3.8A1.5 1.5 0 0 1 3 16l9-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
};

export type Regra = { titulo: string; html: string; rigida?: boolean };

export const REGRAS: Regra[] = [
  {
    titulo: "Foco no propósito do grupo",
    html: "<p>Este espaço é exclusivo para dúvidas, trocas de experiência e conteúdos relacionados ao TikTok Shop e à mentoria Dominion Shop. Assuntos fora desse escopo devem ser evitados.</p>",
  },
  {
    titulo: "Proibido falar mal de outros players, comunidades ou cursos",
    rigida: true,
    html: "<p>É <b>terminantemente proibido</b> criticar, difamar ou expor negativamente outros mentores, comunidades, cursos ou concorrentes do mercado, seja dentro do grupo ou em qualquer outro espaço associado à mentoria.</p><p>O mercado é livre, e cada player tem seu próprio caminho e método. Aqui, nosso foco é entregar o nosso melhor e o nosso diferencial, não desmerecer o trabalho dos outros. Respeito ao mercado é respeito à nossa própria imagem.</p><p>Descumprimento desta regra pode resultar em <b>remoção imediata</b> do grupo, independente de advertências anteriores.</p>",
  },
  {
    titulo: "Proibido falar sobre política, religião ou assuntos polêmicos",
    html: "<p>Não é permitido debater política, religião ou qualquer tema que não tenha relação com a mentoria. O grupo é um ambiente neutro e profissional.</p>",
  },
  {
    titulo: "Respeito acima de tudo",
    html: "<p>Trate todos os membros e mentores com respeito e educação. Não serão tolerados:</p><ul><li>Ofensas, xingamentos ou ironias com outros alunos</li><li>Preconceito de qualquer tipo (racial, religioso, de gênero, etc.)</li><li>Deboche com dúvidas de outros alunos. Todo mundo já foi iniciante</li></ul>",
  },
  {
    titulo: "Faça perguntas claras e objetivas",
    html: '<p>Aqui não existe pergunta “boba”, mas existe pergunta mal formulada. Para que possamos te ajudar da melhor forma e mais rápido, siga a estrutura abaixo. Isso facilita a vida de quem vai responder e ajuda todo mundo que tiver a mesma dúvida no futuro.</p><div class="ex good"><b>Estrutura padrão</b>Assunto: (escolha a categoria da sua dúvida)<br>Dúvida: (explique de forma clara, direta e com detalhes)</div><div class="chips"><span>Farm de contas</span><span>Mineração de produtos</span><span>Validação de produto</span><span>Escala de vídeos</span><span>Estrutura de testes</span><span>Criação de vídeos com IA</span><span>Edição/qualidade de vídeo</span><span>Copy e legendas</span><span>Métricas e desempenho</span><span>Pagamentos/afiliados</span><span>Live com IA</span><span>Outros</span></div><div class="ex good"><b>Como perguntar certo</b>Assunto: Estrutura de testes<br>Dúvida: Quando eu subo 3 vídeos diferentes pro mesmo produto, devo esperar quanto tempo antes de decidir qual vai continuar rodando e qual eu corto?</div><div class="ex bad"><b>Evite perguntas assim</b>“Não tá vendendo, o que eu faço?” · “Alguém pode me ajudar com conta?” · “Isso é normal?”<br>Essas perguntas não dão contexto suficiente pra ninguém te ajudar de verdade.</div>',
  },
  {
    titulo: "Paciência nas respostas",
    html: "<p>Nem sempre o mentor ou os colegas estarão online no mesmo instante. Evite cobranças excessivas ou tom de impaciência. Sua dúvida será respondida assim que possível.</p>",
  },
  {
    titulo: "Ajuda mútua entre alunos",
    html: "<p>Incentivamos fortemente que alunos mais experientes ajudem os iniciantes. Essa é uma mentoria colaborativa: quem ensina, aprende ainda mais.</p>",
  },
  {
    titulo: "Proibido spam e autopromoção",
    html: "<p>Não é permitido:</p><ul><li>Divulgar outros grupos, canais, cursos ou serviços sem autorização</li><li>Enviar links suspeitos ou não relacionados ao tema</li><li>Fazer propaganda de produtos/serviços pessoais dentro do grupo</li></ul>",
  },
  {
    titulo: "Sem prints ou compartilhamento do conteúdo da mentoria",
    html: "<p>O material, as aulas e as estratégias ensinadas são exclusivos para membros. É proibido printar, gravar ou compartilhar o conteúdo fora do grupo.</p>",
  },
  {
    titulo: "Sem áudios longos ou correntes",
    html: "<p>Evite áudios muito extensos, correntes, memes em excesso ou mensagens fora de contexto que poluam o chat.</p>",
  },
  {
    titulo: "Advertências e remoção",
    html: '<p>O descumprimento das regras pode resultar em:</p><div class="steps-pun"><div><b>1ª VEZ</b>Advertência</div><div><b>2ª VEZ</b>Silenciamento temporário</div><div><b>3ª VEZ</b>Remoção definitiva do grupo, sem reembolso, conforme contrato da mentoria</div></div><p>Exceção: a regra rígida do item 2 pode gerar remoção imediata, sem passar pelas etapas acima.</p>',
  },
  {
    titulo: "Espírito de comunidade",
    html: "<p>Ajude, seja ajudado, comemore as vitórias dos colegas e mantenha o ambiente leve e motivador.</p>",
  },
];

export const REGULAMENTO_RACE: Regra[] = [
  {
    titulo: "Período e prazo de envio",
    html: "<p>A corrida da Turma 1 acontece de <b>01/11/2026 a 30/11/2026</b>. O faturamento é acumulativo durante todo este período, somando o GMV de <b>quantas contas você tiver</b>.</p><p>Você deve enviar o total de faturamento no grupo até <b>02/12</b> para análise. Depois dessa data, nenhuma comprovação será aceita e você fica de fora da disputa do pódio.</p>",
  },
  {
    titulo: "Onde e como postar (obrigatório para o pódio)",
    html: "<ul><li>Todas as postagens exclusivamente no tópico <b>Dominion Race</b> do grupo oficial da turma no Telegram.</li><li><b>Print/vídeo:</b> a comprovação deve mostrar a tela do total de GMV faturado, com o filtro de datas de <b>01/11 a 30/11</b>.</li><li><b>Relato da jornada:</b> junto com o print, conte a sua trajetória, o que está achando da mentoria, o que evoluiu nesse período e deixe seu depoimento.</li><li><b>Auditoria:</b> a comprovação pode ser feita por print, mas a equipe pode pedir vídeos ou imagens adicionais da tela do seu celular para validar os resultados.</li><li><b>Identificação:</b> no final da postagem, informe o seu <b>nome completo</b> e o <b>e-mail de compra</b> da mentoria.</li></ul>",
  },
  {
    titulo: "Não serão aceitos",
    html: "<ul><li>Envios após 02/12</li><li>Prints cortados</li><li>Prints sem o filtro de data correto</li><li>Envios sem o relato da jornada</li><li>Envios apenas com texto</li></ul>",
  },
  {
    titulo: "Dominion MVP",
    html: "<p>O prêmio para o aluno mais ativo, constante e colaborativo do grupo. O jogo aqui é na trincheira: ganha quem mais interagir no grupo de alunos, ajudar os outros mentorados com dúvidas e agregar valor de verdade.</p><p>O engajamento é monitorado de forma automática pelo nosso sistema, de olho em todas as mensagens e interações.</p><p><b>Prêmio:</b> surpresa + reconhecimento oficial.</p>",
  },
  {
    titulo: "Regras gerais e apuração",
    html: "<ul><li>O ranking será atualizado pela administração.</li><li>A participação é automática para todos os alunos da Turma 1.</li><li>É vedada a manipulação de dados, uso de contas de terceiros ou qualquer forma de fraude. Em caso de suspeita, a desclassificação pode ocorrer sem aviso prévio.</li><li>A administração reserva o direito de solicitar comprovação adicional em caso de dúvida.</li><li>O resultado será anunciado na live de encerramento.</li><li>O Pix será pago em até 48 horas após a apuração final.</li></ul>",
  },
];
