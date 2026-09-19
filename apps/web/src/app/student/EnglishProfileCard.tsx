import Link from "next/link";
import type { EnglishProfile, Skill } from "@/lib/types";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

const SKILL_ORDER: Skill[] = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "SPEAKING"];

export function EnglishProfileCard({ profile }: { profile: EnglishProfile }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[17px] font-semibold">English Profile</p>
        {profile.overallLevel && (
          <div className="flex flex-col items-end">
            <span className="text-[13px] text-muted">Overall</span>
            <span className="display text-[28px] leading-none text-blue">{profile.overallLevel}</span>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {SKILL_ORDER.map((skill) => {
          const s = profile.skills[skill];
          if (!s) return null;
          const isWeak = profile.weakest === skill;
          return (
            <div key={skill}>
              <div className="mb-1.5 flex justify-between text-[14px] font-semibold">
                <span>{SKILL_LABELS[skill]}</span>
                <span>{s.level}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                <span
                  className={`block h-full rounded-full ${isWeak ? "bg-ink" : "bg-blue"}`}
                  style={{ width: `${Math.max(4, s.score)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link href="/test" className="mt-5 inline-block text-[14px] font-semibold text-blue">
        Пройти тест заново →
      </Link>
    </div>
  );
}
