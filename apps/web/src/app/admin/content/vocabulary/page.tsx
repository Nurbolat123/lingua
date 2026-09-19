import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { PublicUser, VocabularyListResponse } from "@/lib/types";
import { ImportVocabulary } from "./ImportVocabulary";
import { VocabularyForm } from "./VocabularyForm";
import { WordRow } from "./WordRow";

const PAGE_SIZE = 30;

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) qs.set(key, value);
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; level?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [me, list] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<VocabularyListResponse>(
      `/admin/content/vocabulary${buildQuery({ search: sp.search, level: sp.level, page: String(page), pageSize: String(PAGE_SIZE) })}`,
    ),
  ]);
  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));

  return (
    <DashboardShell role="ADMIN" name={me.firstName} title="Словарь" wide>
      <Link href="/admin/content" className="text-sm text-muted">
        ← Контент
      </Link>
      <div className="mt-6 flex flex-col gap-6">
        <VocabularyForm />
        <ImportVocabulary />

        <div className="rounded-2xl border border-line bg-card p-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input
              name="search"
              defaultValue={sp.search}
              placeholder="Поиск по слову или переводу"
              className="h-[42px] w-[260px] rounded-lg border border-line px-3 text-[14px]"
            />
            <select name="level" defaultValue={sp.level ?? ""} className="h-[42px] rounded-lg border border-line bg-white px-3 text-[14px]">
              <option value="">Все уровни</option>
              {["A1", "A2", "B1", "B2", "C1"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button type="submit" className="h-[42px] rounded-full border border-ink px-5 text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper">
              Найти
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[600px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-line text-left text-[12px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Слово</th>
                <th className="px-4 py-3">Перевод</th>
                <th className="px-4 py-3">Уровень</th>
                <th className="px-4 py-3" />
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.items.map((w) => (
                <WordRow key={w.id} word={w} />
              ))}
              {list.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
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
              <Link href={`/admin/content/vocabulary${buildQuery({ search: sp.search, level: sp.level, page: String(page - 1) })}`} className="text-blue">
                ← Назад
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/content/vocabulary${buildQuery({ search: sp.search, level: sp.level, page: String(page + 1) })}`} className="text-blue">
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
