import Link from "next/link";
import { startPlacementAttempt } from "./actions";

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2B3FD6"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className="mt-0.5 shrink-0"
  >
    <path d="M5 12l5 5L20 7" />
  </svg>
);

export default function TestIntroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-[560px] rounded-3xl border border-line bg-card p-9">
        <Link href="/" className="text-sm text-muted">
          ← На главную
        </Link>
        <h1 className="display mt-4 text-[30px] leading-tight">Тест на уровень английского</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          Определим ваш уровень по четырём навыкам: грамматика, лексика, чтение и аудирование.
          Сложность вопросов подстраивается под ваши ответы — ответили верно, следующий вопрос
          сложнее, ошиблись — проще. В конце вы увидите English Profile: уровень по каждому навыку.
        </p>
        <ul className="mt-6 flex flex-col gap-3 text-[15px]">
          <li className="flex gap-3">
            <CheckIcon />
            Регистрация не нужна — можно начать прямо сейчас
          </li>
          <li className="flex gap-3">
            <CheckIcon />
            Около 24 вопросов, 10–15 минут
          </li>
          <li className="flex gap-3">
            <CheckIcon />
            Устную часть (Speaking) можно пройти после регистрации — она требует отдельного
            согласия на запись голоса
          </li>
        </ul>
        <form action={startPlacementAttempt} className="mt-8">
          <button
            type="submit"
            className="h-[54px] w-full rounded-2xl bg-ink text-[17px] font-semibold text-paper transition-colors hover:bg-[#2A2D34]"
          >
            Начать тест
          </button>
        </form>
      </div>
    </main>
  );
}
