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
  title,
  wide,
  children,
}: {
  role: string;
  name: string;
  title?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-10">
        <Link href="/" className="display text-[18px] font-bold text-ink no-underline">
          Soyle<span className="text-blue">Up</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-muted sm:inline">{name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className={`mx-auto px-5 py-10 sm:px-10 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <h1 className="display text-[28px]">{title ?? ROLE_LABEL[role] ?? "Личный кабинет"}</h1>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
