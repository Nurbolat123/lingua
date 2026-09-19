"use client";

import { useTransition } from "react";
import { deleteCourse } from "../actions";

export function DeleteCourseButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`Удалить курс «${title}» вместе со всеми модулями и уроками?`)) return;
    startTransition(() => deleteCourse(id));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-[13px] font-semibold text-error disabled:opacity-60"
    >
      Удалить
    </button>
  );
}
