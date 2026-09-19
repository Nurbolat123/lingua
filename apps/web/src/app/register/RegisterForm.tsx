"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type RoleChoice = "STUDENT" | "PARENT";

const ROLE_HOME: Record<RoleChoice, string> = {
  STUDENT: "/student",
  PARENT: "/parent",
};

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attempt");
  const [role, setRole] = useState<RoleChoice>("STUDENT");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const acceptTerms = form.get("acceptTerms") === "on";
    if (!acceptTerms) {
      setError("Нужно согласие на обработку персональных данных");
      return;
    }

    const payload: Record<string, unknown> = {
      email: form.get("email"),
      password: form.get("password"),
      firstName: form.get("firstName"),
      role,
      acceptTerms: true,
    };
    const lastName = form.get("lastName");
    if (lastName) payload.lastName = lastName;
    if (role === "STUDENT") payload.birthDate = form.get("birthDate");
    if (attemptId) payload.attemptId = attemptId;

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
        setError(message ?? "Не удалось зарегистрироваться. Проверьте данные.");
        setSubmitting(false);
        return;
      }
      router.push(ROLE_HOME[role]);
      router.refresh();
    } catch {
      setError("Не удалось отправить запрос. Проверьте интернет-соединение.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-[440px] rounded-3xl border border-line bg-card p-9">
        <Link href="/" className="text-sm text-muted">
          ← На главную
        </Link>
        <h1 className="display mt-4 text-[28px] leading-tight">Регистрация</h1>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("STUDENT")}
            className={`h-[50px] rounded-2xl border text-[15px] font-semibold transition-colors ${
              role === "STUDENT" ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink"
            }`}
          >
            Я ученик
          </button>
          <button
            type="button"
            onClick={() => setRole("PARENT")}
            className={`h-[50px] rounded-2xl border text-[15px] font-semibold transition-colors ${
              role === "PARENT" ? "border-ink bg-ink text-paper" : "border-line bg-white text-ink"
            }`}
          >
            Я родитель
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="firstName" className="text-sm font-semibold">
              Имя
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              maxLength={80}
              autoComplete="given-name"
              className="h-[50px] rounded-2xl border border-line px-4 text-[16px] focus:border-blue focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="lastName" className="text-sm font-semibold">
              Фамилия (необязательно)
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              maxLength={80}
              autoComplete="family-name"
              className="h-[50px] rounded-2xl border border-line px-4 text-[16px] focus:border-blue focus:outline-none"
            />
          </div>

          {role === "STUDENT" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="birthDate" className="text-sm font-semibold">
                Дата рождения
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                required
                className="h-[50px] rounded-2xl border border-line px-4 text-[16px] focus:border-blue focus:outline-none"
              />
              <span className="text-[13px] text-muted">
                Для учеников младше 18 лет доступ откроется после согласия родителя.
              </span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
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
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className="h-[50px] rounded-2xl border border-line px-4 text-[16px] focus:border-blue focus:outline-none"
            />
            <span className="text-[13px] text-muted">Минимум 8 символов.</span>
          </div>

          <label className="flex items-start gap-3 text-[14px] leading-snug text-muted">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              className="mt-1 h-5 w-5 shrink-0 accent-blue"
            />
            <span>
              Согласен(на) на обработку персональных данных в соответствии с{" "}
              <Link href="/privacy" target="_blank" className="text-blue">
                политикой конфиденциальности
              </Link>{" "}
              и принимаю{" "}
              <Link href="/terms" target="_blank" className="text-blue">
                условия использования
              </Link>
            </span>
          </label>

          {error && <p className="text-[15px] font-semibold text-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-[54px] rounded-2xl bg-ink text-[17px] font-semibold text-paper transition-colors hover:bg-[#2A2D34] disabled:opacity-60"
          >
            {submitting ? "Отправляем…" : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-6 text-center text-[15px] text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-blue">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}
