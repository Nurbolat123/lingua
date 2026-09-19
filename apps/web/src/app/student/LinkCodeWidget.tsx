"use client";

import { useState, useTransition } from "react";
import { createLinkCode } from "./actions";
import type { LinkCode } from "@/lib/types";

export function LinkCodeWidget() {
  const [result, setResult] = useState<LinkCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const data = await createLinkCode();
        setResult(data);
      } catch {
        setError("Не удалось получить код. Попробуйте ещё раз.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[17px] font-semibold">Код для родителя</p>
      <p className="mt-2 text-muted">
        Передайте этот код родителю — он введёт его в своём кабинете, чтобы привязать ваш аккаунт.
        Код действует 24 часа и одноразовый.
      </p>

      {result ? (
        <div className="mt-4 flex flex-col gap-1">
          <span className="display text-[34px] tracking-[0.1em] text-blue">{result.code}</span>
          <span className="text-[14px] text-muted">
            Действителен до {new Date(result.expiresAt).toLocaleString("ru-RU")}
          </span>
        </div>
      ) : null}

      {error && <p className="mt-3 text-[15px] font-semibold text-error">{error}</p>}

      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="mt-4 h-[46px] rounded-full border border-ink px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
      >
        {pending ? "Получаем…" : result ? "Получить новый код" : "Получить код"}
      </button>
    </div>
  );
}
