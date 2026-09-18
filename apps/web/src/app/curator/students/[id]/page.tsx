import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import type { PublicUser, StudentSummary } from "@/lib/types";

export default async function CuratorStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let user: PublicUser;
  let student: StudentSummary;
  try {
    [user, student] = await Promise.all([
      apiFetch<PublicUser>("/users/me"),
      apiFetch<StudentSummary>(`/students/${id}`),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <DashboardShell role="CURATOR" name={user.firstName}>
      <Link href="/curator" className="text-sm text-muted">
        ← Все ученики
      </Link>

      <div className="mt-4 rounded-2xl border border-line bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[20px] font-semibold">
            {student.firstName} {student.lastName ?? ""}
          </p>
          <StatusBadge status={student.status} />
        </div>

        <dl className="mt-5 flex flex-col gap-3">
          <div className="flex justify-between border-b border-paper-2 pb-3 text-[16px]">
            <dt>Целевой уровень</dt>
            <dd className="text-muted">{student.studentProfile.targetLevel ?? "не выбран"}</dd>
          </div>
          <div className="flex justify-between border-b border-paper-2 pb-3 text-[16px]">
            <dt>Минут занятий в день</dt>
            <dd className="text-muted">{student.studentProfile.dailyMinutes}</dd>
          </div>
          <div className="flex justify-between border-b border-paper-2 pb-3 text-[16px]">
            <dt>Цель обучения</dt>
            <dd className="text-muted">{student.studentProfile.goal ?? "не указана"}</dd>
          </div>
          <div className="flex justify-between border-b border-paper-2 pb-3 text-[16px]">
            <dt>Несовершеннолетний</dt>
            <dd className="text-muted">{student.studentProfile.isMinor ? "да" : "нет"}</dd>
          </div>
          <div className="flex justify-between text-[16px]">
            <dt>Последний вход</dt>
            <dd className="text-muted">
              {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString("ru-RU") : "ещё не входил"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-line bg-card p-6 text-muted">
        История, ошибки, записи speaking и проверка домашних заданий появятся на шаге «Куратор и
        домашние задания».
      </div>
    </DashboardShell>
  );
}
