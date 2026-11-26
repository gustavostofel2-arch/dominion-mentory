export default function Cabecalho({ etiqueta, titulo, texto }: { etiqueta: string; titulo: string; texto?: string }) {
  return (
    <div className="wrap pg-head">
      <span className="eyebrow">{etiqueta}</span>
      <h1>{titulo}</h1>
      {texto && <p>{texto}</p>}
    </div>
  );
}
