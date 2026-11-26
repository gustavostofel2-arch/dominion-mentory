export default function Cabecalho({ etiqueta, titulo, texto }: { etiqueta: string; titulo: string; texto?: string }) {
  return (
    <div className="wrap pg-head">
      {etiqueta ? <span className="eyebrow">{etiqueta}</span> : null}
      <h1>{titulo}</h1>
      {texto && <p>{texto}</p>}
    </div>
  );
}
