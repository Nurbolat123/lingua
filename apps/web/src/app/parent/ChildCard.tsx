"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setConsent, unlinkChild } from "./actions";
import { StatusBadge } from "@/components/StatusBadge";
import type { ChildSummary, ConsentType } from "@/lib/types";

const CONSENT_LABELS: Record<ConsentType, string> = {
  DATA_PROCESSING: "Обработка персональных данных",
  VOICE_RECORDING: "Запись голоса (Speaking)",
  CAMERA: "Камера при самостоятельной работе",
  MICROPHONE: "Микрофон при самостоятельной работе",
  MARKETING: "Маркетинговые рассылки",
};

const CONSENT_ORDER: ConsentType[] = [
  "DATA_PROCESSING",
  "VOICE_RECORDING",
  "CAMERA",
  "MICROPHONE",
  "MARKETING",
];

export function ChildCard({ child }: { child: ChildSummary }) {
  const [pending, startTransition] = useTransition();
  const grantedTypes = new Set(child.consents.map((c) => c.type));

  function toggleConsent(type: ConsentType) {
    startTransition(() => setConsent(child.id, type, !grantedTypes.has(type)));
  }

  function handleUnlink() {
    if (!window.confirm(`Отвязать ${child.firstName} от вашего аккаунта?`)) return;
    startTransition(() => unlinkChild(child.id));
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold">
            {child.firstName} {child.lastName ?? ""}
          </p>
          <p className="mt-1 text-[14px] text-muted">
            {child.studentProfile.targetLevel ? `Цель: ${child.studentProfile.targetLevel} · ` : ""}
            {child.studentProfile.dailyMinutes} мин/день
          </p>
        </div>
        <StatusBadge status={child.status} />
      </div>

      <Link
        href={`/parent/children/${child.id}`}
        className="mt-4 inline-flex h-[42px] items-center rounded-2xl border border-ink px-5 text-[14px] font-semibold text-ink no-underline hover:bg-ink hover:text-paper"
      >
        Прогресс и отчёты →
      </Link>

      {child.studentProfile.isMinor ? (
        <div className="mt-5 flex flex-col gap-2">
          <p className="text-sm font-semibold">Согласия</p>
          {CONSENT_ORDER.map((type) => {
            const granted = grantedTypes.has(type);
            return (
              <label
                key={type}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
              >
                <span className="text-[15px]">{CONSENT_LABELS[type]}</span>
                <input
                  type="checkbox"
                  checked={granted}
                  disabled={pending}
                  onChange={() => toggleConsent(type)}
                  className="h-5 w-5 accent-blue"
                />
              </label>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-[14px] text-muted">
          Согласия взрослый ученик выдаёт себе сам.
        </p>
      )}

      <button
        type="button"
        onClick={handleUnlink}
        disabled={pending}
        className="mt-5 text-[14px] font-semibold text-error disabled:opacity-60"
      >
        Отвязать
      </button>
    </div>
  );
}
