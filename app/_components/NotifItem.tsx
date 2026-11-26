import type { Notif } from "@/lib/notificar";
import { tempoRelativo } from "@/lib/tempo";
import { Icone } from "./Icone";

const ICONE = { aviso: "megaphone", post: "news", manual: "bell" } as const;
const ROTULO = { aviso: "Aviso", post: "Novidade", manual: "Comunicado" } as const;

export default function NotifItem({ n }: { n: Notif }) {
  const externo = !!n.link && !n.link.startsWith("/");
  const corpo = (
    <>
      <span className={`ni-ic ${n.tipo}`}>
        <Icone nome={ICONE[n.tipo]} />
      </span>
      <span className="ni-tx">
        <span className="ni-top">
          <small>{ROTULO[n.tipo]}</small>
          <small className="ni-quando">{tempoRelativo(n.criadoEm)}</small>
        </span>
        <b>{n.titulo}</b>
        {n.texto && <span className="ni-sub">{n.texto}</span>}
      </span>
      {n.nova && <span className="ni-dot" aria-label="Nova" />}
    </>
  );
  const classe = `notif-item${n.nova ? " nova" : ""}`;
  return n.link ? (
    <a className={classe} href={n.link} {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {corpo}
    </a>
  ) : (
    <div className={classe}>{corpo}</div>
  );
}
