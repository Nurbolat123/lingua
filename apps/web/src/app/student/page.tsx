import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { MeResponse, TodayPlan } from "@/lib/types";
import { EnglishProfileCard } from "./EnglishProfileCard";
import { getMyHomework } from "./homework-actions";
import { getSkillHistory, getTodayPlan } from "./learning-actions";
import { LinkCodeWidget } from "./LinkCodeWidget";
import { ProfileForm } from "./ProfileForm";
import { SkillHistoryChart } from "./SkillHistoryChart";
import { TodayPlanCard } from "./TodayPlanCard";

const HOMEWORK_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Ждёт выполнения",
  SUBMITTED: "На проверке",
  REVIEWED: "Проверено",
  RETURNED: "Вернули на доработку",
};

export default async function StudentPage() {
  const user = await apiFetch<MeResponse>("/users/me");
  const hasProfile = !user.requiresParentConsent && user.englishProfile?.overall != null;
  const plan: TodayPlan | null = hasProfile ? await getTodayPlan().catch(() => null) : null;
  const skillHistory = hasProfile ? await getSkillHistory(user.id).catch(() => null) : null;
  const homework = user.requiresParentConsent ? [] : await getMyHomework().catch(() => []);
  const activeHomework = homework.filter((h) => h.status !== "REVIEWED");

  return (
    <DashboardShell role="STUDENT" name={user.firstName}>
      {user.requiresParentConsent ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-[17px] font-semibold">Попросите родителя подтвердить регистрацию</p>
            <p className="mt-2 text-muted">
              Пока родитель не даст согласие на обработку персональных данных, доступ к урокам и
              изменению профиля ограничен.
            </p>
          </div>
          <LinkCodeWidget />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-[17px] font-semibold">
              {user.firstName} {user.lastName ?? ""}
            </p>
            <p className="mt-1 text-muted">{user.email}</p>
          </div>

          {plan ? (
            <TodayPlanCard plan={plan} />
          ) : (
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="text-[17px] font-semibold">Пройдите вступительный тест</p>
              <p className="mt-2 text-muted">
                Узнайте свой уровень по пяти навыкам английского и получите план на каждый день.
              </p>
              <Link
                href="/test"
                className="mt-4 inline-flex h-[46px] items-center rounded-2xl bg-ink px-5 text-[15px] font-semibold text-paper"
              >
                Пройти тест
              </Link>
            </div>
          )}

          {user.englishProfile?.overall != null && <EnglishProfileCard profile={user.englishProfile} />}

          {skillHistory && <SkillHistoryChart snapshots={skillHistory} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/student/homework"
              className="rounded-2xl border border-line bg-card p-6 no-underline transition-colors hover:border-blue"
            >
              <p className="text-[15px] font-semibold text-ink">Задания от куратора</p>
              {activeHomework.length === 0 ? (
                <p className="mt-2 text-[14px] text-muted">Здесь появятся домашние задания, когда куратор их назначит.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {activeHomework.slice(0, 3).map((h) => (
                    <li key={h.id} className="flex items-center justify-between text-[14px]">
                      <span className="truncate text-ink">{h.title}</span>
                      <span className="ml-2 shrink-0 text-muted">{HOMEWORK_STATUS_LABEL[h.status]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Link>
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="text-[15px] font-semibold">Уведомления</p>
              <p className="mt-2 text-[14px] text-muted">Пока новых уведомлений нет.</p>
            </div>
          </div>

          {user.studentProfile && (
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="text-[17px] font-semibold">Профиль и цель</p>
              <div className="mt-4">
                <ProfileForm profile={user.studentProfile} />
              </div>
            </div>
          )}

          <LinkCodeWidget />
        </div>
      )}
    </DashboardShell>
  );
}
