import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getLesson } from "./actions";
import { LessonPlayer } from "./LessonPlayer";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let lesson;
  try {
    lesson = await getLesson(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return <LessonPlayer lessonId={id} initialLesson={lesson} />;
}
