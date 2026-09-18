import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { Course, PublicUser } from "@/lib/types";
import { CourseForm } from "./CourseForm";
import { DeleteCourseButton } from "./DeleteCourseButton";

export default async function CoursesPage() {
  const [me, courses] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<Course[]>("/admin/content/courses"),
  ]);

  return (
    <DashboardShell role="ADMIN" name={me.firstName} title="Курсы и уроки" wide>
      <Link href="/admin/content" className="text-sm text-muted">
        ← Контент
      </Link>
      <div className="mt-6 flex flex-col gap-6">
        <CourseForm />
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card p-6 text-muted">Пока нет курсов.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-card p-5">
                <div>
                  <Link href={`/admin/content/courses/${c.id}`} className="text-[16px] font-semibold text-ink hover:text-blue">
                    {c.title}
                  </Link>
                  <p className="mt-1 text-[13px] text-muted">
                    {c.level} · {c.audience === "KIDS" ? "дети" : c.audience === "TEENS" ? "подростки" : "взрослые"}
                    {c.isDemo ? " · демо" : ""}
                  </p>
                </div>
                <DeleteCourseButton id={c.id} title={c.title} />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
