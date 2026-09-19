import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { DashboardShell } from "@/components/DashboardShell";
import type { LessonWithBlocks, PublicUser } from "@/lib/types";
import { ExercisePreview } from "./ExercisePreview";

const BLOCK_TITLE: Record<string, string> = {
  INTRO: "Введение",
  VOCABULARY: "Новые слова",
  GRAMMAR: "Грамматика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  EXERCISE: "Упражнения",
  SPEAKING: "Говорение",
  MINI_TEST: "Мини-тест",
  HOMEWORK: "Домашнее задание",
};

export default async function LessonPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [me, lesson] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    apiFetch<LessonWithBlocks>(`/admin/content/lessons/${id}/preview`),
  ]);

  return (
    <DashboardShell role="ADMIN" name={me.firstName} title={`Предпросмотр: ${lesson.title}`} wide>
      <Link href={`/admin/content/lessons/${id}`} className="text-sm text-muted">
        ← Вернуться к редактированию
      </Link>
      <p className="mt-1 text-[13px] text-muted">
        Так урок увидит ученик — правильные ответы скрыты сервером, здесь их физически нет в ответе API.
      </p>

      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-5">
        {lesson.blocks.map((block) => {
          const c = block.content as Record<string, unknown>;
          return (
            <section key={block.id} className="rounded-2xl border border-line bg-card p-6">
              <span className="text-[13px] font-semibold uppercase tracking-wide text-muted">
                {BLOCK_TITLE[block.type] ?? block.type}
              </span>
              {block.title && <h2 className="display mt-1 text-[20px]">{block.title}</h2>}

              <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed">
                {typeof c.text === "string" && <p>{c.text}</p>}
                {typeof c.explanation === "string" && <p>{c.explanation}</p>}
                {Array.isArray(c.words) && (
                  <div className="flex flex-wrap gap-2">
                    {(c.words as string[]).map((w) => (
                      <span key={w} className="rounded-full bg-lime px-3 py-1 text-[14px] font-medium text-ink">
                        {w}
                      </span>
                    ))}
                  </div>
                )}
                {typeof c.audioUrl === "string" && c.audioUrl && (
                  <audio controls src={c.audioUrl} className="w-full" />
                )}

                {block.exercises.map((ex) => (
                  <div key={ex.id} className="rounded-xl bg-paper p-4">
                    <ExercisePreview exercise={ex} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {lesson.blocks.length === 0 && (
          <div className="rounded-2xl border border-line bg-card p-6 text-center text-muted">
            В этом уроке пока нет блоков.
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
