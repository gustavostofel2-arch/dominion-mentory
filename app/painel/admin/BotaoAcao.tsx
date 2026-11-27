"use client";

/** Botão de ação que envia campos extras (ex.: dir=up). Os campos entram no formulário na hora do clique. */
export default function BotaoAcao({
  action,
  campos,
  className,
  disabled,
  children,
}: {
  action: (form: FormData) => void | Promise<void>;
  campos: Record<string, string>;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      className={className}
      disabled={disabled}
      onClick={(e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        for (const [nome, valor] of Object.entries(campos)) {
          let campo = form.querySelector<HTMLInputElement>(`input[data-botao-acao="${nome}"]`);
          if (!campo) {
            campo = document.createElement("input");
            campo.type = "hidden";
            campo.name = nome;
            campo.dataset.botaoAcao = nome;
            form.appendChild(campo);
          }
          campo.value = valor;
        }
      }}
    >
      {children}
    </button>
  );
}
