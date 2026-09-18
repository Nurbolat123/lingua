import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { PublicUser } from "@/lib/types";

export default async function ParentPage() {
  const user = await apiFetch<PublicUser>("/users/me");

  return (
    <DashboardShell role="PARENT" name={user.firstName}>
      <div className="rounded-2xl border border-line bg-card p-6">
        <p className="text-[17px] font-semibold">Здравствуйте, {user.firstName}!</p>
        <p className="mt-2 text-muted">
          Привязка детей по коду и управление согласиями появятся на следующем шаге ROADMAP.
        </p>
      </div>
    </DashboardShell>
  );
}
