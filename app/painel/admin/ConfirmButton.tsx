"use client";

export default function ConfirmButton({
  action,
  msg,
  className,
  children,
}: {
  action: (form: FormData) => void | Promise<void>;
  msg: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      formAction={action}
      formNoValidate
      className={className}
      onClick={(e) => {
        if (!window.confirm(msg)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
