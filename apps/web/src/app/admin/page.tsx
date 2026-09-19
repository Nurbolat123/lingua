import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import { StatusBadge } from "@/components/StatusBadge";
import type { PublicUser, Role, UserListResponse } from "@/lib/types";
import { assignCurator, setUserStatus } from "./actions";
import { CreateStaffForm } from "./CreateStaffForm";

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Ученик",
  PARENT: "Родитель",
  CURATOR: "Куратор",
  ADMIN: "Админ",
};

const PAGE_SIZE = 20;

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [me, list, curatorsList] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<UserListResponse>(
      `/admin/users${buildQuery({
        search: sp.search,
        role: sp.role,
        status: sp.status,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      })}`,
    ),
    apiFetch<UserListResponse>(`/admin/users${buildQuery({ role: "CURATOR", pageSize: "100" })}`),
  ]);

  const totalPages = Math.max(1, Math.ceil(list.total / list.pageSize));
  const curators = curatorsList.items;

  return (
    <DashboardShell role="ADMIN" name={me.firstName} wide>
      <div className="flex flex-col gap-6">
        <Link href="/admin/content" className="text-sm font-semibold text-blue">
          Контент (курсы, словарь, банк вопросов) →
        </Link>
        <CreateStaffForm />

        <div className="rounded-2xl border border-line bg-card p-6">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="search" className="text-sm font-semibold">
                Поиск
              </label>
              <input
                id="search"
                name="search"
                type="text"
                defaultValue={sp.search}
                placeholder="Имя или email"
                className="h-[44px] w-[220px] rounded-xl border border-line px-3 text-[15px] focus:border-blue focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="role" className="text-sm font-semibold">
                Роль
              </label>
              <select
                id="role"
                name="role"
                defaultValue={sp.role ?? ""}
                className="h-[44px] rounded-xl border border-line bg-white px-3 text-[15px] focus:border-blue focus:outline-none"
              >
                <option value="">Все</option>
                <option value="STUDENT">Ученик</option>
                <option value="PARENT">Родитель</option>
                <option value="CURATOR">Куратор</option>
                <option value="ADMIN">Админ</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm font-semibold">
                Статус
              </label>
              <select
                id="status"
                name="status"
                defaultValue={sp.status ?? ""}
                className="h-[44px] rounded-xl border border-line bg-white px-3 text-[15px] focus:border-blue focus:outline-none"
              >
                <option value="">Все</option>
                <option value="ACTIVE">Активен</option>
                <option value="PENDING_CONSENT">Ждёт согласия</option>
                <option value="BLOCKED">Заблокирован</option>
              </select>
            </div>
            <button
              type="submit"
              className="h-[44px] rounded-full border border-ink px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              Найти
            </button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[720px] border-collapse text-[15px]">
            <thead>
              <tr className="border-b border-line text-left text-[13px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Имя</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Роль</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3">Назначить куратора</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.items.map((user) => (
                <tr key={user.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    {user.firstName} {user.lastName ?? ""}
                  </td>
                  <td className="px-5 py-3 text-muted">{user.email}</td>
                  <td className="px-5 py-3">{ROLE_LABEL[user.role]}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-5 py-3">
                    {user.role === "STUDENT" ? (
                      <form action={assignCurator} className="flex items-center gap-2">
                        <input type="hidden" name="studentId" value={user.id} />
                        <select
                          name="curatorId"
                          defaultValue=""
                          className="h-[38px] rounded-lg border border-line bg-white px-2 text-[14px]"
                        >
                          <option value="" disabled>
                            Выбрать…
                          </option>
                          {curators.map((c: PublicUser) => (
                            <option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName ?? ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-ink px-3 py-1.5 text-[13px] font-semibold text-ink hover:bg-ink hover:text-paper"
                        >
                          Назначить
                        </button>
                      </form>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {user.id === me.id ? null : (
                      <form
                        action={async () => {
                          "use server";
                          await setUserStatus(user.id, user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED");
                        }}
                      >
                        <button
                          type="submit"
                          className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
                            user.status === "BLOCKED"
                              ? "border-ink text-ink hover:bg-ink hover:text-paper"
                              : "border-error text-error hover:bg-error hover:text-white"
                          }`}
                        >
                          {user.status === "BLOCKED" ? "Разблокировать" : "Заблокировать"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {list.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted">
                    Никого не найдено
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-[14px] text-muted">
          <span>
            Всего: {list.total} · страница {list.page} из {totalPages}
          </span>
          <div className="flex gap-3">
            {page > 1 && (
              <Link
                href={`/admin${buildQuery({ search: sp.search, role: sp.role, status: sp.status, page: String(page - 1) })}`}
                className="text-blue"
              >
                ← Назад
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin${buildQuery({ search: sp.search, role: sp.role, status: sp.status, page: String(page + 1) })}`}
                className="text-blue"
              >
                Вперёд →
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
