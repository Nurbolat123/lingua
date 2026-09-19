import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser, Skill } from "@/lib/types";
import { getChildLessonReport, getChildSummary } from "../../../../actions";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

const HOMEWORK_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "не выполнено",
  SUBMITTED: "на проверке",
  REVIEWED: "выполнено",
  RETURNED: "на доработке",
};

export default async function LessonReportPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params;

  let user: PublicUser;
  let childName: string;
  let report: Awaited<ReturnType<typeof getChildLessonReport>>;
  try {
    const [me, child, r] = await Promise.all([
      apiFetch<PublicUser>("/users/me"),
      getChildSummary(id),
      getChildLessonReport(id, lessonId),
    ]);
    user = me;
    childName = `${child.firstName} ${child.lastName ?? ""}`.trim();
    report = r;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <DashboardShell role="PARENT" name={user.firstName}>
      <div className="mx-auto flex max-w-[520px] flex-col gap-5">
        <Link href={`/parent/children/${id}`} className="text-[14px] font-semibold text-muted hover:text-ink">
          ← {childName}
        </Link>

        <div className="rounded-3xl border border-line bg-card p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="display text-[20px]">Отчёт об уроке</p>
            <span className="rounded-full bg-lime px-3 py-1 text-[13px] font-semibold text-ink">
              {report.status === "COMPLETED" ? "Урок завершён" : "В процессе"}
            </span>
          </div>
          <p className="mt-1 text-[15px] text-muted">{report.lessonTitle}</p>

          <div className="mt-5 flex justify-between border-b border-paper-2 pb-4 text-[16px]">
            <span className="text-muted">Время занятия</span>
            <strong>{Math.round(report.activeSeconds / 60)} мин</strong>
          </div>

          {report.skills.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-b border-paper-2 pb-4">
              {report.skills.map((s) => (
                <div key={s.skill} className="flex justify-between text-[15px]">
                  <span className="text-muted">{SKILL_LABELS[s.skill]}</span>
                  <strong>
                    {s.correct}/{s.total}
                  </strong>
                </div>
              ))}
            </div>
          )}

          {report.homework && (
            <div className="mt-4 flex justify-between border-b border-paper-2 pb-4 text-[16px]">
              <span className="text-muted">Домашнее задание</span>
              <strong>{HOMEWORK_STATUS_LABEL[report.homework.status]}</strong>
            </div>
          )}

          {report.homework?.reviewComment && (
            <div className="mt-4">
              <p className="text-[13px] font-semibold text-muted">Комментарий куратора</p>
              <p className="mt-1 text-[15px]">{report.homework.reviewComment}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
