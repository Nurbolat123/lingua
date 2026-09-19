"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/student",
  PARENT: "/parent",
  CURATOR: "/curator",
  ADMIN: "/admin",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      email: form.get("email"),
      password: form.get("password"),
    };
    if (attemptId) payload.attemptId = attemptId;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 401 ? "Неверный email или пароль" : (data?.message ?? "Не удалось войти"));
        setSubmitting(false);
        return;
      }
      router.push(ROLE_HOME[data.user.role] ?? "/");
      router.refresh();
    } catch {
      setError("Не удалось отправить запрос. Проверьте интернет-соединение.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-[420px] rounded-3xl border border-line bg-card p-9">
        <Link href="/" className="text-sm text-muted">
          ← На главную
        </Link>
        <h1 className="display mt-4 text-[28px] leading-tight">Вход</h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-[50px] rounded-2xl border border-line px-4 text-[16px] focus:border-blue focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-[50px] rounded-2xl border border-line px-4 text-[16px] focus:border-blue focus:outline-none"
            />
          </div>

          {error && <p className="text-[15px] font-semibold text-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-[54px] rounded-2xl bg-ink text-[17px] font-semibold text-paper transition-colors hover:bg-[#2A2D34] disabled:opacity-60"
          >
            {submitting ? "Входим…" : "Войти"}
          </button>
        </form>

        <p className="mt-6 text-center text-[15px] text-muted">
          Ещё нет аккаунта?{" "}
          <Link href="/register" className="text-blue">
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </main>
  );
}
