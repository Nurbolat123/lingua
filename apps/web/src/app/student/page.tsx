import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { PublicUser } from "@/lib/types";

export default async function StudentPage() {
  const user = await apiFetch<PublicUser>("/users/me");

  return (
    <DashboardShell role="STUDENT" name={user.firstName}>
      {user.status === "PENDING_CONSENT" ? (
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-[17px] font-semibold">Попросите родителя подтвердить регистрацию</p>
          <p className="mt-2 text-muted">
            Пока родитель не даст согласие на обработку персональных данных, доступ к урокам и
            профилю ограничен. Код для родителя и остальные функции появятся на следующем шаге.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-[17px] font-semibold">Здравствуйте, {user.firstName}!</p>
          <p className="mt-2 text-muted">
            Профиль, цель обучения и код для родителя появятся на следующем шаге ROADMAP.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
