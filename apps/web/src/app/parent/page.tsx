import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { ChildSummary, PublicUser } from "@/lib/types";
import { ChildCard } from "./ChildCard";
import { LinkChildForm } from "./LinkChildForm";

export default async function ParentPage() {
  const [user, children] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<ChildSummary[]>("/parents/children"),
  ]);

  return (
    <DashboardShell role="PARENT" name={user.firstName}>
      <div className="flex flex-col gap-6">
        <LinkChildForm />

        {children.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-6 text-muted">
            Пока нет привязанных детей. Получите код в кабинете ребёнка и введите его выше.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
