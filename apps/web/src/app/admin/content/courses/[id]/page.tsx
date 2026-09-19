import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { CourseWithModules, PublicUser } from "@/lib/types";
import { DeleteLessonButton, DeleteModuleButton } from "./DeleteButtons";
import { LessonForm } from "./LessonForm";
import { ModuleForm } from "./ModuleForm";

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, course] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<CourseWithModules>(`/admin/content/courses/${id}`),
  ]);

  return (
    <DashboardShell role="ADMIN" name={me.firstName} title={course.title} wide>
      <Link href="/admin/content/courses" className="text-sm text-muted">
        ← Все курсы
      </Link>
      <p className="mt-2 text-[14px] text-muted">
        {course.level} · {course.audience === "KIDS" ? "дети" : course.audience === "TEENS" ? "подростки" : "взрослые"}
        {course.isDemo ? " · демо" : ""}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {course.modules.map((m) => (
          <div key={m.id} className="rounded-2xl border border-line bg-card p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[17px] font-semibold">{m.title}</p>
              <DeleteModuleButton courseId={course.id} id={m.id} title={m.title} />
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {m.lessons.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                  <Link href={`/admin/content/lessons/${l.id}`} className="text-[15px] font-medium text-ink hover:text-blue">
                    {l.title}
                  </Link>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-muted">{l.estimatedMinutes} мин</span>
                    <DeleteLessonButton courseId={course.id} id={l.id} title={l.title} />
                  </div>
                </div>
              ))}
              {m.lessons.length === 0 && <p className="text-[14px] text-muted">Пока нет уроков.</p>}
            </div>

            <div className="mt-4 border-t border-paper-2 pt-4">
              <LessonForm courseId={course.id} moduleId={m.id} />
            </div>
          </div>
        ))}
        {course.modules.length === 0 && (
          <div className="rounded-2xl border border-line bg-card p-6 text-muted">Пока нет модулей.</div>
        )}

        <div className="rounded-2xl border border-line bg-card p-6">
          <ModuleForm courseId={course.id} />
        </div>
      </div>
    </DashboardShell>
  );
}
