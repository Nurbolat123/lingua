"use client";

import { useState } from "react";
import { updateNotificationSetting } from "./actions";
import type { NotificationSettingRow, NotificationType } from "@/lib/types";

const TYPE_LABEL: Record<NotificationType, string> = {
  LESSON_COMPLETED: "Урок завершён",
  ASSIGNMENT_CREATED: "Назначено домашнее задание",
  ASSIGNMENT_OVERDUE: "Домашнее задание просрочено",
  REVIEW_CREATED: "Куратор проверил работу",
  SCORE_DROPPED: "Балл по навыку снизился",
  LESSON_MISSED: "Пропущен день занятий",
};

const TYPE_ORDER: NotificationType[] = [
  "LESSON_COMPLETED", "ASSIGNMENT_CREATED", "ASSIGNMENT_OVERDUE", "REVIEW_CREATED", "SCORE_DROPPED", "LESSON_MISSED",
];

export function NotificationSettingsForm({ initial }: { initial: NotificationSettingRow[] }) {
  const [rows, setRows] = useState(initial);
  const byType = new Map(rows.map((r) => [r.type, r]));

  function toggle(type: NotificationType, channel: "inApp" | "email" | "telegram") {
    const row = byType.get(type);
    if (!row) return;
    const next = { ...row, [channel]: !row[channel] };
    setRows((prev) => prev.map((r) => (r.type === type ? next : r)));
    updateNotificationSetting(type, { [channel]: next[channel] });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-1 text-[13px] font-semibold text-muted">
        <span>Событие</span>
        <span className="w-14 text-center">В приложении</span>
        <span className="w-14 text-center">Email</span>
        <span className="w-14 text-center">Telegram</span>
      </div>
      {TYPE_ORDER.map((type) => {
        const row = byType.get(type);
        if (!row) return null;
        return (
          <div key={type} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3">
            <span className="text-[15px]">{TYPE_LABEL[type]}</span>
            <input
              type="checkbox"
              checked={row.inApp}
              onChange={() => toggle(type, "inApp")}
              className="h-5 w-5 accent-blue justify-self-center"
            />
            <input
              type="checkbox"
              checked={row.email}
              onChange={() => toggle(type, "email")}
              className="h-5 w-5 accent-blue justify-self-center"
            />
            <input
              type="checkbox"
              checked={row.telegram}
              onChange={() => toggle(type, "telegram")}
              className="h-5 w-5 accent-blue justify-self-center"
            />
          </div>
        );
      })}
    </div>
  );
}
