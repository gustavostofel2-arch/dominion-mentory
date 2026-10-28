import Countdown from "./Countdown";

/** Dominion Race completa (pódio, datas, regras e MVP). Usada dentro do painel, para mentorados. */
export default function RaceCompleta() {
  return (
    <div className="race">
              <div className="top">
                <svg className="crown" viewBox="0 0 64 64" aria-hidden="true">
                  <defs>
                    <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#ffe29a" />
                      <stop offset=".5" stopColor="#ffb020" />
                      <stop offset="1" stopColor="#ff7a1a" />
                    </linearGradient>
                  </defs>
                  <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill="url(#cg)" />
                  <rect x="8" y="49" width="48" height="7" rx="2" fill="url(#cg)" />
                  <circle cx="3" cy="18" r="3" fill="#ffe29a" />
                  <circle cx="32" cy="10" r="3.4" fill="#ffe29a" />
                  <circle cx="61" cy="18" r="3" fill="#ffe29a" />
                </svg>
                <span className="eyebrow">Regulamento oficial · Turma 1</span>
                <h2>DOMINION RACE</h2>
                <p>
                  A corrida da Turma 1 está oficialmente aberta! São 2 premiações acontecendo ao mesmo tempo: o pódio de
                  faturamento e o Dominion MVP.
                </p>
              </div>

              <div className="dates">
                <div className="date"><small>Início</small><b>01/11/2026</b></div>
                <div className="date"><small>Encerramento</small><b>30/11/2026</b></div>
                <div className="date hot"><small>Prazo máximo de envio</small><b>02/12</b></div>
              </div>
              <Countdown completo />

              <div className="podium" role="img" aria-label="Pódio: 1º lugar R$ 1.000, 2º lugar R$ 500, 3º lugar R$ 200">
                <div className="step p2"><span className="medal">2º</span><span className="pix">R$ 500</span><small>em Pix</small></div>
                <div className="step p1">
                  <svg className="mini-crown" viewBox="0 0 64 64" aria-hidden="true">
                    <path d="M6 46 3 18l14 12 15-20 15 20 14-12-3 28z" fill="url(#cg)" />
                    <rect x="8" y="49" width="48" height="7" rx="2" fill="url(#cg)" />
                  </svg>
                  <span className="medal">1º</span><span className="pix">R$ 1.000</span><small>em Pix</small>
                </div>
                <div className="step p3"><span className="medal">3º</span><span className="pix">R$ 200</span><small>em Pix</small></div>
              </div>

              <div className="cols">
                <div className="box">
                  <h3>Parte 1 · Pódio de faturamento</h3>
                  <p>
                    Os alunos competem para faturar o máximo possível no TikTok Shop. Não importa com quantas contas você
                    trabalha: vale somar o GMV de <b>quantas contas você tiver</b>. O faturamento é acumulativo durante todo
                    o período.
                  </p>
                  <div className="warnline">
                    Envie o total de faturamento no grupo até <b>02/12</b>. Depois dessa data, nenhuma comprovação será
                    aceita e você fica fora da disputa do pódio.
                  </div>
                </div>
                <div className="box">
                  <h3>Onde e como postar</h3>
                  <ul>
                    <li>Todas as postagens exclusivamente no tópico <b>Dominion Race</b> do grupo oficial da turma no Telegram.</li>
                    <li><b>Print/vídeo:</b> tela do total de GMV faturado, com o filtro de datas de <b>01/11 a 30/11</b>.</li>
                    <li><b>Relato da jornada:</b> junto com o print, conte sua trajetória, o que achou da mentoria, o que evoluiu e deixe seu depoimento.</li>
                    <li><b>Auditoria:</b> a equipe pode pedir vídeos ou imagens adicionais da tela do seu celular para validar os resultados.</li>
                    <li><b>Identificação:</b> no final, informe seu <b>nome completo</b> e o <b>e-mail de compra</b> da mentoria.</li>
                  </ul>
                </div>
                <div className="box no">
                  <h3>Não serão aceitos</h3>
                  <ul>
                    <li>Envios após 02/12</li>
                    <li>Prints cortados</li>
                    <li>Prints sem o filtro de data correto</li>
                    <li>Envios sem o relato da jornada</li>
                    <li>Envios apenas com texto</li>
                  </ul>
                </div>
                <div className="box">
                  <h3>Parte 3 · Regras gerais e apuração</h3>
                  <ul>
                    <li>O ranking será atualizado pela administração.</li>
                    <li>A participação é automática para todos os alunos da Turma 1.</li>
                    <li>É vedada a manipulação de dados, uso de contas de terceiros ou qualquer forma de fraude. Em caso de suspeita, a desclassificação pode ocorrer sem aviso prévio.</li>
                    <li>A administração pode solicitar comprovação adicional em caso de dúvida.</li>
                    <li>O resultado será anunciado na live de encerramento.</li>
                    <li>O Pix será pago em até 48 horas após a apuração final.</li>
                  </ul>
                </div>
              </div>

              <div className="mvp">
                <svg className="tr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
                  <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
                </svg>
                <div>
                  <h3>Parte 2 · Dominion MVP</h3>
                  <p>
                    O prêmio para o aluno mais ativo, constante e colaborativo do grupo. O jogo aqui é na trincheira: ganha
                    quem mais interagir, ajudar os outros mentorados com dúvidas e agregar valor de verdade. O engajamento é
                    monitorado de forma automática pelo nosso sistema, de olho em todas as mensagens e interações.
                  </p>
                  <span className="prize">Prêmio: surpresa + reconhecimento oficial</span>
                </div>
              </div>

              <p className="foot">Bora pra cima! Vence quem mais executa.</p>
            </div>
  );
}
