import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./LogoutButton";

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Кабинет ученика",
  PARENT: "Кабинет родителя",
  CURATOR: "Кабинет куратора",
  ADMIN: "Админка",
};

export function DashboardShell({
  role,
  name,
  children,
}: {
  role: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-10">
        <Link href="/" className="display flex items-center gap-3 text-ink no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue text-[16px] font-bold text-white">
            L
          </span>
          <span className="text-[18px] font-bold">Lingua</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">{name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-10">
        <h1 className="display text-[28px]">{ROLE_LABEL[role] ?? "Личный кабинет"}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
