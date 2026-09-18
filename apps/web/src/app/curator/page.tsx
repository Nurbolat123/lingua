import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import type { PublicUser, ReviewQueueItem } from "@/lib/types";
import { getMyStudents, getReviewQueue } from "./curator-actions";

function reviewUrl(item: ReviewQueueItem): string {
  if (item.type === "HOMEWORK") return `/curator/students/${item.studentId}/homework/${item.id}`;
  if (item.type === "LESSON") return `/curator/students/${item.studentId}/lesson-answers/${item.id}`;
  return `/curator/students/${item.studentId}/placement-attempts/${item.id}`;
}

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function CuratorPage({
  searchParams,
}: {
  searchParams: Promise<{ inactiveDays?: string; lowScore?: string; hasPending?: string }>;
}) {
  const sp = await searchParams;
  const filters = { inactiveDays: sp.inactiveDays, lowScore: sp.lowScore === "true", hasPending: sp.hasPending === "true" };

  const [user, students, queue] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    getMyStudents(filters),
    getReviewQueue(),
  ]);

  return (
    <DashboardShell role="CURATOR" name={user.firstName}>
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="display text-[19px]">Очередь на проверку</h2>
          {queue.length === 0 ? (
            <p className="mt-3 text-[14px] text-muted">Ничего не ждёт проверки.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {queue.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={reviewUrl(item)}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-4 no-underline transition-colors hover:border-blue"
                >
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[13px] text-muted">{item.studentName}</p>
                  </div>
                  <span className="shrink-0 text-[13px] text-muted">
                    {item.at ? new Date(item.at).toLocaleDateString("ru-RU") : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-[19px]">Мои ученики</h2>
            <div className="flex flex-wrap gap-2 text-[13px]">
              <Link
                href={buildQuery({ inactiveDays: filters.inactiveDays === "7" ? undefined : "7", lowScore: sp.lowScore, hasPending: sp.hasPending }) || "/curator"}
                className={`rounded-full border px-3 py-1.5 no-underline ${filters.inactiveDays === "7" ? "border-ink bg-ink text-paper" : "border-line text-ink"}`}
              >
                Не занимался 7+ дней
              </Link>
              <Link
                href={buildQuery({ inactiveDays: sp.inactiveDays, lowScore: filters.lowScore ? undefined : "true", hasPending: sp.hasPending }) || "/curator"}
                className={`rounded-full border px-3 py-1.5 no-underline ${filters.lowScore ? "border-ink bg-ink text-paper" : "border-line text-ink"}`}
              >
                Низкий результат
              </Link>
              <Link
                href={buildQuery({ inactiveDays: sp.inactiveDays, lowScore: sp.lowScore, hasPending: filters.hasPending ? undefined : "true" }) || "/curator"}
                className={`rounded-full border px-3 py-1.5 no-underline ${filters.hasPending ? "border-ink bg-ink text-paper" : "border-line text-ink"}`}
              >
                Есть непроверенное
              </Link>
              {(filters.inactiveDays || filters.lowScore || filters.hasPending) && (
                <Link href="/curator" className="rounded-full px-3 py-1.5 text-blue no-underline">
                  Сбросить
                </Link>
              )}
            </div>
          </div>

          {students.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-line bg-card p-6 text-muted">
              {sp.inactiveDays || sp.lowScore || sp.hasPending
                ? "Никто не подходит под фильтр."
                : "Пока нет назначенных учеников. Администратор назначит их в админке."}
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-4">
              {students.map((student) => (
                <Link
                  key={student.id}
                  href={`/curator/students/${student.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-6 no-underline transition-colors hover:border-blue"
                >
                  <div>
                    <p className="text-[17px] font-semibold text-ink">
                      {student.firstName} {student.lastName ?? ""}
                    </p>
                    <p className="mt-1 text-[14px] text-muted">
                      {student.studentProfile?.targetLevel ? `Цель: ${student.studentProfile.targetLevel} · ` : ""}
                      {student.englishProfile?.overallLevel ? `Уровень: ${student.englishProfile.overallLevel} · ` : ""}
                      {student.studentProfile?.dailyMinutes} мин/день
                      {student.studentProfile?.isMinor ? " · несовершеннолетний" : ""}
                    </p>
                  </div>
                  <StatusBadge status={student.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
