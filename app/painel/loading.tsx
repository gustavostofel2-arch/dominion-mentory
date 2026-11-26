/** Aparece na hora ao trocar de página, enquanto o conteúdo chega. */
export default function Carregando() {
  return (
    <main aria-busy="true" aria-label="Carregando">
      <div className="wrap pg-head">
        <div className="sk sk-linha" style={{ width: 120 }} />
        <div className="sk sk-titulo" />
        <div className="sk sk-linha" style={{ width: "60%" }} />
      </div>
      <div className="wrap" style={{ marginTop: 28, display: "grid", gap: 16 }}>
        <div className="sk sk-card" />
        <div className="sk sk-card" style={{ height: 160 }} />
      </div>
    </main>
  );
}
