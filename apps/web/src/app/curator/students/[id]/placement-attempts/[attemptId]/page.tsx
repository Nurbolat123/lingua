import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import { getStudentCard, getStudentRecordings } from "../../../../curator-actions";
import { PlacementSpeakingReview } from "./PlacementSpeakingReview";

export default async function CuratorPlacementAttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;

  let user: PublicUser;
  let studentName: string;
  let reviewed = false;
  try {
    const [me, student, recordings] = await Promise.all([
      apiFetch<PublicUser>("/users/me"),
      getStudentCard(id),
      getStudentRecordings(id),
    ]);
    user = me;
    studentName = `${student.firstName} ${student.lastName ?? ""}`.trim();
    reviewed = recordings.placement.find((r) => r.id === attemptId)?.reviewed ?? false;
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
        <h1 className="display text-[22px]">Вступительный тест — Speaking</h1>
        <PlacementSpeakingReview attemptId={attemptId} studentId={id} alreadyReviewed={reviewed} />
      </div>
    </DashboardShell>
  );
}
