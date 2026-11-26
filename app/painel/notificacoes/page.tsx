import AtivarPush from "../../_components/AtivarPush";
import Cabecalho from "../../_components/Cabecalho";
import NotifItem from "../../_components/NotifItem";
import Rodape from "../../_components/Rodape";
import { sessaoLogada } from "@/lib/admin";
import { lerLidoAte, listarNotificacoes, marcarLidas } from "@/lib/notificar";

export const metadata = { title: "Notificações | Dominion Mentory", robots: { index: false } };

export default async function Notificacoes() {
  const s = await sessaoLogada();
  const [itens, lidoAte] = await Promise.all([listarNotificacoes(50), s ? lerLidoAte(s.email) : Promise.resolve(new Date().toISOString())]);
  if (s) await marcarLidas(s.email);
  const lista = itens.map((n) => ({ ...n, nova: new Date(n.criadoEm).getTime() > new Date(lidoAte).getTime() }));

  return (
    <>
      <main>
        <Cabecalho etiqueta="Comunidade" titulo="Notificações" texto="Tudo o que a equipe avisou, em ordem. Ative o push para receber na hora, mesmo com o site fechado." />
        <div className="wrap">
          <AtivarPush vapid={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null} />
          {lista.length === 0 ? (
            <div className="vazio-card">
              <b>Nenhuma notificação ainda.</b>
              <p>Quando a equipe enviar um aviso, ele aparece aqui.</p>
            </div>
          ) : (
            <div className="notif-lista">
              {lista.map((n) => <NotifItem key={n.id} n={n} />)}
            </div>
          )}
        </div>
      </main>
      <Rodape />
    </>
  );
}
