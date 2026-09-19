import Link from "next/link";
import type { Skill, TodayPlan } from "@/lib/types";
import { PracticeTaskCard } from "./PracticeTaskCard";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

export function TodayPlanCard({ plan }: { plan: TodayPlan }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[17px] font-semibold">План на сегодня</p>
      <p className="mt-1 text-[13px] text-muted">~{plan.dailyMinutes} мин · в приоритете:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {plan.prioritySkills.map((s) => (
          <span key={s} className="rounded-full bg-paper-2 px-3 py-1 text-[13px] font-semibold">
            {SKILL_LABELS[s]}
          </span>
        ))}
      </div>

      {plan.lesson ? (
        <div className="mt-4 rounded-xl bg-paper-2 p-4">
          <p className="font-semibold">{plan.lesson.title}</p>
          <p className="text-[13px] text-muted">~{plan.lesson.estimatedMinutes} мин</p>
          <Link
            href={`/student/lessons/${plan.lesson.id}`}
            className="mt-3 inline-flex h-[44px] items-center rounded-xl bg-ink px-5 text-[14px] font-semibold text-paper"
          >
            {plan.lesson.status === "IN_PROGRESS" ? "Продолжить урок" : "Начать урок"}
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-muted">Урок появится, когда куратор назначит курс.</p>
      )}

      {plan.vocabularyReview.total > 0 && (
        <Link href="/student/vocabulary" className="mt-4 block rounded-xl bg-paper-2 p-4 hover:bg-line/40">
          <p className="font-semibold">Повторить слова</p>
          <p className="text-[13px] text-muted">{plan.vocabularyReview.total} слов готовы к повторению</p>
        </Link>
      )}

      {plan.practiceQuestion && <PracticeTaskCard question={plan.practiceQuestion} />}
    </div>
  );
}
