import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import { SkillHistoryChart } from "@/app/student/SkillHistoryChart";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser, Skill } from "@/lib/types";
import {
  getStudentCard, getStudentHomework, getStudentMistakes, getStudentRecordings, getStudentSkillHistory,
} from "../../curator-actions";
import { AssignHomeworkForm } from "./AssignHomeworkForm";
import { PlanEditForm } from "./PlanEditForm";

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

export default async function CuratorStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let user: PublicUser;
  let student: Awaited<ReturnType<typeof getStudentCard>>;
  let skillHistory: Awaited<ReturnType<typeof getStudentSkillHistory>>;
  let mistakes: Awaited<ReturnType<typeof getStudentMistakes>>;
  let recordings: Awaited<ReturnType<typeof getStudentRecordings>>;
  let homework: Awaited<ReturnType<typeof getStudentHomework>>;
  try {
    [user, student, skillHistory, mistakes, recordings, homework] = await Promise.all([
      apiFetch<PublicUser>("/users/me"),
      getStudentCard(id),
      getStudentSkillHistory(id),
      getStudentMistakes(id),
      getStudentRecordings(id),
      getStudentHomework(id),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <DashboardShell role="CURATOR" name={user.firstName}>
      <div className="flex flex-col gap-6">
        <Link href="/curator" className="text-[14px] font-semibold text-muted hover:text-ink">
          ← Все ученики
        </Link>

        <div className="rounded-2xl border border-line bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[20px] font-semibold">
              {student.firstName} {student.lastName ?? ""}
            </p>
            <StatusBadge status={student.status} />
          </div>
          <p className="mt-2 text-[14px] text-muted">
            Последний вход: {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString("ru-RU") : "ещё не входил"}
          </p>
        </div>

        {student.englishProfile && student.englishProfile.overall != null ? (
          <div className="rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-[17px] font-semibold">English Profile</p>
              {student.englishProfile.overallLevel && (
                <span className="display text-[22px] text-blue">{student.englishProfile.overallLevel}</span>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {(Object.keys(SKILL_LABELS) as Skill[]).map((skill) => {
                const s = student.englishProfile!.skills[skill];
                if (!s) return null;
                return (
                  <div key={skill}>
                    <div className="mb-1 flex justify-between text-[14px] font-semibold">
                      <span>{SKILL_LABELS[skill]}</span>
                      <span>{s.level}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                      <span className="block h-full rounded-full bg-blue" style={{ width: `${Math.max(4, s.score)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-card p-6 text-muted">Ещё не проходил вступительный тест.</div>
        )}

        {skillHistory.length > 0 && <SkillHistoryChart snapshots={skillHistory} />}

        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-[17px] font-semibold">Записи речи (Speaking)</p>
          {recordings.lesson.length === 0 && recordings.placement.length === 0 ? (
            <p className="mt-2 text-[14px] text-muted">Записей пока нет.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {recordings.placement.map((r) => (
                <Link
                  key={`p-${r.id}`}
                  href={`/curator/students/${id}/placement-attempts/${r.id}`}
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-[14px] no-underline hover:border-blue"
                >
                  <span>Вступительный тест</span>
                  <span className={r.reviewed ? "text-muted" : "font-semibold text-blue"}>
                    {r.reviewed ? "проверено" : "ждёт проверки"}
                  </span>
                </Link>
              ))}
              {recordings.lesson.map((r) => (
                <Link
                  key={`l-${r.id}`}
                  href={`/curator/students/${id}/lesson-answers/${r.id}`}
                  className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-[14px] no-underline hover:border-blue"
                >
                  <span>Урок «{r.title}»</span>
                  <span className={r.reviewed ? "text-muted" : "font-semibold text-blue"}>
                    {r.reviewed ? "проверено" : "ждёт проверки"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-card p-6">
          <p className="text-[17px] font-semibold">Последние ошибки</p>
          {mistakes.length === 0 ? (
            <p className="mt-2 text-[14px] text-muted">Ошибок пока не было.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {mistakes.slice(0, 10).map((m) => (
                <li key={m.id} className="rounded-xl border border-line px-4 py-3 text-[14px]">
                  <p className="text-muted">{m.lessonTitle}</p>
                  <p className="mt-0.5">{(m.exerciseContent.question as string) ?? (m.exerciseContent.text as string) ?? "—"}</p>
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
                <li key={h.id}>
                  <Link
                    href={`/curator/students/${id}/homework/${h.id}`}
                    className="flex items-center justify-between rounded-xl border border-line px-4 py-3 text-[14px] no-underline hover:border-blue"
                  >
                    <span>{h.title}</span>
                    <span className={h.status === "SUBMITTED" ? "font-semibold text-blue" : "text-muted"}>
                      {HOMEWORK_STATUS_LABEL[h.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 border-t border-paper-2 pt-5">
            <p className="mb-3 text-[15px] font-semibold">Назначить новое задание</p>
            <AssignHomeworkForm studentId={id} />
          </div>
        </div>

        {student.studentProfile && (
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-[17px] font-semibold">Цель и уровень</p>
            <div className="mt-4">
              <PlanEditForm studentId={id} targetLevel={student.studentProfile.targetLevel} goal={student.studentProfile.goal} />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
