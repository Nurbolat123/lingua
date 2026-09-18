import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import { getStudentCard, getStudentRecordings } from "../../../../curator-actions";
import { LessonSpeakingReview } from "./LessonSpeakingReview";

export default async function CuratorLessonAnswerPage({
  params,
}: {
  params: Promise<{ id: string; answerId: string }>;
}) {
  const { id, answerId } = await params;

  let user: PublicUser;
  let studentName: string;
  let title = "Speaking-упражнение урока";
  let reviewed = false;
  try {
    const [me, student, recordings] = await Promise.all([
      apiFetch<PublicUser>("/users/me"),
      getStudentCard(id),
      getStudentRecordings(id),
    ]);
    user = me;
    studentName = `${student.firstName} ${student.lastName ?? ""}`.trim();
    const item = recordings.lesson.find((r) => r.id === answerId);
    if (item) {
      title = `Урок «${item.title}» — Speaking`;
      reviewed = item.reviewed;
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <DashboardShell role="CURATOR" name={user.firstName}>
      <div className="mx-auto flex max-w-[640px] flex-col gap-5">
        <Link href={`/curator/students/${id}`} className="text-[14px] font-semibold text-muted hover:text-ink">
          ← {studentName}
        </Link>
        <h1 className="display text-[22px]">{title}</h1>
        <LessonSpeakingReview answerId={answerId} studentId={id} alreadyReviewed={reviewed} />
      </div>
    </DashboardShell>
  );
}
