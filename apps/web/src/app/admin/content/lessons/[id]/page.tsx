import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { LessonWithBlocks, PublicUser } from "@/lib/types";
import { AddBlockForm } from "./AddBlockForm";
import { BlockCard } from "./BlockCard";

export default async function LessonBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, lesson] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<LessonWithBlocks>(`/admin/content/lessons/${id}`),
  ]);

  return (
    <DashboardShell role="ADMIN" name={me.firstName} title={lesson.title} wide>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted">Конструктор урока</span>
        <Link
          href={`/admin/content/lessons/${id}/preview`}
          className="rounded-full bg-ink px-5 py-2 text-[14px] font-semibold text-paper hover:bg-[#2A2D34]"
        >
          Предпросмотр глазами ученика →
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {lesson.blocks.map((block) => (
          <BlockCard key={block.id} lessonId={id} block={block} />
        ))}
        {lesson.blocks.length === 0 && (
          <div className="rounded-2xl border border-line bg-card p-6 text-muted">Пока нет блоков.</div>
        )}
        <AddBlockForm lessonId={id} nextOrder={lesson.blocks.length} />
      </div>
    </DashboardShell>
  );
}
