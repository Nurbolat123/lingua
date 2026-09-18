import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import type { CuratorStudent, PublicUser } from "@/lib/types";

export default async function CuratorPage() {
  const [user, students] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<CuratorStudent[]>("/curator/students"),
  ]);

  return (
    <DashboardShell role="CURATOR" name={user.firstName}>
      {students.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-6 text-muted">
          Пока нет назначенных учеников. Администратор назначит их в админке.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {students.map((student) => (
            <Link
              key={student.id}
              href={`/curator/students/${student.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-6 no-underline transition-colors hover:border-blue"
            >
              <div>
                <p className="text-[17px] font-semibold text-ink">
                  {student.firstName} {student.lastName ?? ""}
                </p>
                <p className="mt-1 text-[14px] text-muted">
                  {student.studentProfile.targetLevel
                    ? `Цель: ${student.studentProfile.targetLevel} · `
                    : ""}
                  {student.studentProfile.dailyMinutes} мин/день
                  {student.studentProfile.isMinor ? " · несовершеннолетний" : ""}
                </p>
              </div>
              <StatusBadge status={student.status} />
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
