import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { PublicUser, QuestionListResponse } from "@/lib/types";
import { ImportQuestions } from "./ImportQuestions";
import { QuestionForm } from "./QuestionForm";
import { QuestionRow } from "./QuestionRow";

const PAGE_SIZE = 30;
const SKILLS = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "SPEAKING"];
const LEVELS = ["A1", "A1+", "A2", "A2+", "B1", "B1+", "B2", "B2+", "C1"];

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) qs.set(key, value);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; level?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [me, list] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<QuestionListResponse>(
      `/admin/content/questions${buildQuery({ skill: sp.skill, level: sp.level, page: String(page), pageSize: String(PAGE_SIZE) })}`,
    ),
  ]);
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <DashboardShell role="ADMIN" name={me.firstName} title="Банк вопросов" wide>
      <Link href="/admin/content" className="text-sm text-muted">
        ← Контент
      </Link>
      <div className="mt-6 flex flex-col gap-6">
        <QuestionForm />
        <ImportQuestions />

        <div className="rounded-2xl border border-line bg-card p-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <select name="skill" defaultValue={sp.skill ?? ""} className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]">
              <option value="">Все навыки</option>
              {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="level" defaultValue={sp.level ?? ""} className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]">
              <option value="">Все уровни</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <button type="submit" className="h-[42px] rounded-full border border-ink px-5 text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper">
              Найти
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[720px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Навык</th>
                <th className="px-4 py-3">Уровень</th>
                <th className="px-4 py-3">Слож.</th>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Вопрос</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.items.map((q) => (
                <QuestionRow key={q.id} item={q} />
              ))}
              {list.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    Ничего не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-[14px] text-muted">
          <span>Всего: {list.total} · страница {list.page} из {totalPages}</span>
          <div className="flex gap-3">
            {page > 1 && (
              <Link href={`/admin/content/questions${buildQuery({ skill: sp.skill, level: sp.level, page: String(page - 1) })}`} className="text-blue">
                ← Назад
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/content/questions${buildQuery({ skill: sp.skill, level: sp.level, page: String(page + 1) })}`} className="text-blue">
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
