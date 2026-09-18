import Link from "next/link";
import { scoreToLevel } from "@/lib/levels";
import type { PlacementResults, Skill } from "@/lib/types";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

const SKILL_ORDER: Skill[] = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "SPEAKING"];

export function ResultsView({
  attemptId,
  results,
  includeSpeaking,
  saved,
}: {
  attemptId: string;
  results: PlacementResults | null;
  includeSpeaking: boolean;
  saved: boolean;
}) {
  const overall = results?.overall;
  const overallLevel = overall != null ? scoreToLevel(overall) : null;

  return (
    <main className="flex min-h-screen justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-[560px]">
        <Link href="/" className="text-sm text-muted">
          ← На главную
        </Link>

        <div className="mt-4 rounded-3xl border border-line bg-card p-8 shadow-[0_30px_60px_-30px_rgba(22,24,29,0.25)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[14px] font-semibold text-muted">Ваш English Profile</span>
              <h1 className="display mt-1 text-[24px]">Результат теста</h1>
            </div>
            {overallLevel && (
              <div className="flex flex-col items-end">
                <span className="text-[13px] text-muted">Overall</span>
                <span className="display text-[40px] leading-none text-blue">{overallLevel}</span>
              </div>
            )}
          </div>

          <div className="mt-7 flex flex-col gap-4">
            {SKILL_ORDER.map((skill) => {
              const r = results?.[skill];
              if (!r) return null;
              if ("status" in r) {
                return (
                  <div key={skill}>
                    <div className="mb-2 flex justify-between text-[15px] font-semibold">
                      <span>{SKILL_LABELS[skill]}</span>
                      <span className="text-muted">на проверке у куратора</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-paper-2" />
                  </div>
                );
              }
              const isWeak = results?.weakest === skill;
              return (
                <div key={skill}>
                  <div className="mb-2 flex justify-between text-[15px] font-semibold">
                    <span>{SKILL_LABELS[skill]}</span>
                    <span>{r.level}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-paper-2">
                    <span
                      className={`block h-full rounded-full ${isWeak ? "bg-ink" : "bg-blue"}`}
                      style={{ width: `${Math.max(4, r.score)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {(results?.strongest || results?.weakest) && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {results?.strongest && (
                <div className="rounded-2xl bg-lime p-4 text-ink">
                  <p className="text-[13px] font-semibold">Сильная сторона</p>
                  <p className="text-[18px] font-bold">{SKILL_LABELS[results.strongest]}</p>
                </div>
              )}
              {results?.weakest && (
                <div className="rounded-2xl bg-ink p-4 text-paper">
                  <p className="text-[13px] font-semibold">Нужно подтянуть</p>
                  <p className="text-[18px] font-bold">{SKILL_LABELS[results.weakest]}</p>
                </div>
              )}
            </div>
          )}

          {!includeSpeaking && (
            <p className="mt-6 text-[14px] text-muted">
              Устная часть (Speaking) не пройдена — она доступна после регистрации и согласия на
              запись голоса.
            </p>
          )}
        </div>

        {saved ? (
          <p className="mt-6 text-center text-[15px] text-muted">Результат сохранён в вашем профиле.</p>
        ) : (
          <div className="mt-6 rounded-2xl border border-line bg-card p-6 text-center">
            <p className="text-[16px] font-semibold">Сохраните результат</p>
            <p className="mt-1 text-[14px] text-muted">
              Зарегистрируйтесь или войдите — результат привяжется к вашему профилю.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                href={`/register?attempt=${attemptId}`}
                className="h-[48px] rounded-2xl bg-ink px-6 text-[15px] font-semibold leading-[48px] text-paper"
              >
                Зарегистрироваться
              </Link>
              <Link
                href={`/login?attempt=${attemptId}`}
                className="h-[48px] rounded-2xl border border-ink px-6 text-[15px] font-semibold leading-[48px] text-ink"
              >
                У меня есть аккаунт
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
