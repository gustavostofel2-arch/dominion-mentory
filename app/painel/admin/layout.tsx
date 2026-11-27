import { exigirAdmin } from "@/lib/admin";
import AdminTabs from "./AdminTabs";
import AbrirAncora from "./AbrirAncora";
import MensagemAdmin from "./MensagemAdmin";
import { Suspense } from "react";

export const metadata = { title: "Admin | Dominion Mentory", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await exigirAdmin(); // sem ser admin: página não encontrada
  return (
    <main>
      <div className="wrap adm">
        <span className="eyebrow">Área restrita</span>
        <h1>Admin</h1>
        <p className="sub">Edite o painel dos mentorados sem mexer em código. O que você salvar aparece para os alunos em instantes.</p>
        <AdminTabs />
        <AbrirAncora />
        <Suspense fallback={null}>
          <MensagemAdmin />
        </Suspense>
        {children}
      </div>
    </main>
  );
}
