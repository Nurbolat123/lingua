import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { PublicUser } from "@/lib/types";

export default async function CuratorPage() {
  const user = await apiFetch<PublicUser>("/users/me");

  return (
    <DashboardShell role="CURATOR" name={user.firstName}>
      <div className="rounded-2xl border border-line bg-card p-6">
        <p className="text-[17px] font-semibold">Здравствуйте, {user.firstName}!</p>
        <p className="mt-2 text-muted">
          Список назначенных учеников появится на следующем шаге ROADMAP.
        </p>
      </div>
    </DashboardShell>
  );
}
