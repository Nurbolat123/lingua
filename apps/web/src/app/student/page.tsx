import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { MeResponse } from "@/lib/types";
import { EnglishProfileCard } from "./EnglishProfileCard";
import { LinkCodeWidget } from "./LinkCodeWidget";
import { ProfileForm } from "./ProfileForm";

export default async function StudentPage() {
  const user = await apiFetch<MeResponse>("/users/me");

  return (
    <DashboardShell role="STUDENT" name={user.firstName}>
      {user.requiresParentConsent ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-[17px] font-semibold">Попросите родителя подтвердить регистрацию</p>
            <p className="mt-2 text-muted">
              Пока родитель не даст согласие на обработку персональных данных, доступ к урокам и
              изменению профиля ограничен.
            </p>
          </div>
          <LinkCodeWidget />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="text-[17px] font-semibold">
              {user.firstName} {user.lastName ?? ""}
            </p>
            <p className="mt-1 text-muted">{user.email}</p>
          </div>

          {user.englishProfile?.overall != null ? (
            <EnglishProfileCard profile={user.englishProfile} />
          ) : (
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="text-[17px] font-semibold">Пройдите вступительный тест</p>
              <p className="mt-2 text-muted">
                Узнайте свой уровень по пяти навыкам английского и получите English Profile.
              </p>
              <Link
                href="/test"
                className="mt-4 inline-flex h-[46px] items-center rounded-2xl bg-ink px-5 text-[15px] font-semibold text-paper"
              >
                Пройти тест
              </Link>
            </div>
          )}

          {user.studentProfile && (
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="text-[17px] font-semibold">Профиль и цель</p>
              <div className="mt-4">
                <ProfileForm profile={user.studentProfile} />
              </div>
            </div>
          )}

          <LinkCodeWidget />
        </div>
      )}
    </DashboardShell>
  );
}
