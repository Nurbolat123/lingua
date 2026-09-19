"use client";

import { useState } from "react";
import { createTelegramLinkCode, unlinkTelegram } from "./actions";
import type { TelegramLinkCode, TelegramStatus } from "@/lib/types";

export function TelegramLink({ initial }: { initial: TelegramStatus }) {
  const [status, setStatus] = useState(initial);
  const [linkCode, setLinkCode] = useState<TelegramLinkCode | null>(null);
  const [pending, setPending] = useState(false);

  async function handleGetCode() {
    setPending(true);
    try {
      setLinkCode(await createTelegramLinkCode());
    } finally {
      setPending(false);
    }
  }

  async function handleUnlink() {
    setPending(true);
    try {
      await unlinkTelegram();
      setStatus({ ...status, linked: false });
      setLinkCode(null);
    } finally {
      setPending(false);
    }
  }

  if (!status.botAvailable) {
    return (
      <div className="rounded-2xl border border-line bg-card p-5 text-[14px] text-muted">
        Telegram-бот пока не настроен — эта функция появится позже.
      </div>
    );
  }

  if (status.linked) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-line bg-card p-5">
        <p className="text-[15px] font-semibold text-blue">Telegram привязан ✓</p>
        <button
          type="button"
          onClick={handleUnlink}
          disabled={pending}
          className="text-[14px] font-semibold text-error disabled:opacity-60"
        >
          Отвязать
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      {!linkCode ? (
        <>
          <p className="text-[14px] text-muted">Привяжите Telegram, чтобы получать уведомления там.</p>
          <button
            type="button"
            onClick={handleGetCode}
            disabled={pending}
            className="mt-3 h-[44px] rounded-2xl bg-ink px-5 text-[14px] font-semibold text-paper disabled:opacity-40"
          >
            {pending ? "Готовим код…" : "Привязать Telegram"}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[14px]">
            {linkCode.deepLink ? (
              <>
                Откройте{" "}
                <a href={linkCode.deepLink} target="_blank" rel="noreferrer" className="font-semibold text-blue">
                  ссылку в Telegram
                </a>{" "}
                — бот привяжет аккаунт автоматически.
              </>
            ) : (
              <>Отправьте боту команду:</>
            )}
          </p>
          <code className="rounded-xl bg-paper-2 px-4 py-3 text-[15px] font-semibold">/start {linkCode.code}</code>
          <p className="text-[13px] text-muted">Код действует до {new Date(linkCode.expiresAt).toLocaleTimeString("ru-RU")}.</p>
        </div>
      )}
    </div>
  );
}
