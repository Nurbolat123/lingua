import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api";
import type { Homework, PublicUser } from "@/lib/types";
import { getMyHomework } from "../homework-actions";

const STATUS_LABEL: Record<Homework["status"], string> = {
  ASSIGNED: "Ждёт выполнения",
  SUBMITTED: "На проверке",
  REVIEWED: "Проверено",
  RETURNED: "Вернули на доработку",
};

export default async function HomeworkListPage() {
  const [user, list] = await Promise.all([apiFetch<PublicUser>("/users/me"), getMyHomework()]);

  return (
    <DashboardShell role="STUDENT" name={user.firstName}>
      <div className="mx-auto flex max-w-[640px] flex-col gap-4">
        <Link href="/student" className="text-[14px] font-semibold text-muted hover:text-ink">
          ← В кабинет
        </Link>
        <h1 className="display text-[22px]">Домашние задания</h1>

        {list.length === 0 ? (
          <p className="text-muted">Пока нет домашних заданий.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((h) => (
              <Link
                key={h.id}
                href={`/student/homework/${h.id}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-card p-5 no-underline transition-colors hover:border-blue"
              >
                <div>
                  <p className="text-[16px] font-semibold text-ink">{h.title}</p>
                  {h.dueAt && (
                    <p className="mt-1 text-[13px] text-muted">Срок: {new Date(h.dueAt).toLocaleDateString("ru-RU")}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-paper-2 px-3 py-1 text-[13px] font-semibold">
                  {STATUS_LABEL[h.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
