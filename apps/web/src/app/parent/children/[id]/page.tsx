import Link from "next/link";
import { notFound } from "next/navigation";
import { SkillHistoryChart } from "@/app/student/SkillHistoryChart";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser, Skill } from "@/lib/types";
import {
  getChildHomework, getChildLessons, getChildSkillHistory, getChildSummary, getChildWeeklySummary,
} from "../../actions";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

const HOMEWORK_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Ждёт выполнения",
  SUBMITTED: "На проверке",
  REVIEWED: "Проверено",
  RETURNED: "Возвращено на доработку",
};

const LESSON_STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "В процессе",
  COMPLETED: "Завершён",
};

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let user: PublicUser;
  let child: Awaited<ReturnType<typeof getChildSummary>>;
  let skillHistory: Awaited<ReturnType<typeof getChildSkillHistory>>;
  let weekly: Awaited<ReturnType<typeof getChildWeeklySummary>>;
  let lessons: Awaited<ReturnType<typeof getChildLessons>>;
  let homework: Awaited<ReturnType<typeof getChildHomework>>;
  try {
    [user, child, skillHistory, weekly, lessons, homework] = await Promise.all([
      apiFetch<PublicUser>("/users/me"),
      getChildSummary(id),
      getChildSkillHistory(id),
      getChildWeeklySummary(id),
      getChildLessons(id),
      getChildHomework(id),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const curatorComments = homework.filter((h) => h.reviewComment).slice(0, 5);

  return (
    <DashboardShell role="PARENT" name={user.firstName}>
      <div className="flex flex-col gap-6">
        <Link href="/parent" className="text-[14px] font-semibold text-muted hover:text-ink">
          ← Все дети
        </Link>

        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[20px] font-semibold">
              {child.firstName} {child.lastName ?? ""}
            </p>
            <StatusBadge status={child.status} />
          </div>
          <p className="mt-2 text-[14px] text-muted">
            Куратор: {child.curator ? `${child.curator.firstName} ${child.curator.lastName ?? ""}` : "пока не назначен"}
          </p>
          <p className="mt-1 text-[14px] text-muted">
            Последний вход: {child.lastLoginAt ? new Date(child.lastLoginAt).toLocaleString("ru-RU") : "ещё не входил"}
          </p>
        </div>

        <div>
          <p className="mb-3 text-[15px] font-semibold">Сводка за неделю</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-card p-4 text-center">
              <p className="display text-[24px]">{weekly.lessonsCompleted}</p>
              <p className="text-[13px] text-muted">уроков завершено</p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-4 text-center">
              <p className="display text-[24px]">{weekly.minutesStudied}</p>
              <p className="text-[13px] text-muted">минут занятий</p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-4 text-center">
              <p className="display text-[24px]">{weekly.homeworkDone}/{weekly.homeworkAssigned}</p>
              <p className="text-[13px] text-muted">ДЗ выполнено</p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-4 text-center">
              <p className="display text-[24px]">{weekly.englishProfile?.overallLevel ?? "—"}</p>
              <p className="text-[13px] text-muted">текущий уровень</p>
            </div>
          </div>
        </div>

        {weekly.englishProfile && weekly.englishProfile.overall != null && (
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-[17px] font-semibold">English Profile</p>
            <div className="mt-4 flex flex-col gap-3">
              {(Object.keys(SKILL_LABELS) as Skill[]).map((skill) => {
                const s = weekly.englishProfile!.skills[skill];
                const d = weekly.skillDeltas.find((x) => x.skill === skill);
                if (!s) return null;
                return (
                  <div key={skill}>
                    <div className="mb-1 flex justify-between text-[14px] font-semibold">
                      <span>{SKILL_LABELS[skill]}</span>
                      <span>
                        {s.level}
                        {d?.delta != null && d.delta !== 0 && (
                          <span className={d.delta > 0 ? "ml-2 text-blue" : "ml-2 text-error"}>
                            {d.delta > 0 ? `+${d.delta}` : d.delta} за неделю
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                      <span className="block h-full rounded-full bg-blue" style={{ width: `${Math.max(4, s.score)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {skillHistory.length > 0 && <SkillHistoryChart snapshots={skillHistory} />}

        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-[17px] font-semibold">Уроки</p>
          {lessons.length === 0 ? (
            <p className="mt-2 text-[14px] text-muted">Уроков пока не было.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/parent/children/${id}/lessons/${l.lessonId}`}
                    className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-[14px] no-underline hover:border-blue"
                  >
                    <span>{l.lessonTitle}</span>
                    <span className="flex items-center gap-3 text-muted">
                      <span>{Math.round(l.activeSeconds / 60)} мин</span>
                      <span>{LESSON_STATUS_LABEL[l.status] ?? l.status}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-[17px] font-semibold">Домашние задания</p>
          {homework.length === 0 ? (
            <p className="mt-2 text-[14px] text-muted">Заданий пока нет.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {homework.map((h) => (
                <li key={h.id} className="rounded-xl border border-line px-4 py-3 text-[14px]">
                  <div className="flex items-center justify-between">
                    <span>{h.title}</span>
                    <span className="text-muted">{HOMEWORK_STATUS_LABEL[h.status]}</span>
                  </div>
                  {h.reviewComment && <p className="mt-1.5 text-muted">«{h.reviewComment}»</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {curatorComments.length > 0 && (
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-[17px] font-semibold">Комментарии куратора</p>
            <ul className="mt-3 flex flex-col gap-3">
              {curatorComments.map((h) => (
                <li key={h.id} className="text-[14px]">
                  <p className="text-muted">{h.title}</p>
                  <p className="mt-0.5">{h.reviewComment}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
