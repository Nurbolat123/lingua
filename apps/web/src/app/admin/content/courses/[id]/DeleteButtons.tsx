"use client";

import { useTransition } from "react";
import { deleteLesson, deleteModule } from "../../actions";

export function DeleteModuleButton({ courseId, id, title }: { courseId: string; id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Удалить модуль «${title}» вместе с уроками?`)) return;
        startTransition(() => deleteModule(courseId, id));
      }}
      className="text-[13px] font-semibold text-error disabled:opacity-60"
    >
      Удалить модуль
    </button>
  );
}

export function DeleteLessonButton({ courseId, id, title }: { courseId: string; id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Удалить урок «${title}»?`)) return;
        startTransition(() => deleteLesson(courseId, id));
      }}
      className="text-[13px] font-semibold text-error disabled:opacity-60"
    >
      Удалить
    </button>
  );
}
