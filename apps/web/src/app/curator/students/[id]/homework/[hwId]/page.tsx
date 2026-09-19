import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import { getStudentCard, getStudentHomework } from "../../../../curator-actions";
import { HomeworkReview } from "./HomeworkReview";

export default async function CuratorHomeworkPage({ params }: { params: Promise<{ id: string; hwId: string }> }) {
  const { id, hwId } = await params;

  let user: PublicUser;
  let studentName: string;
  let homework;
  try {
    const [me, student, list] = await Promise.all([
      apiFetch<PublicUser>("/users/me"),
      getStudentCard(id),
      getStudentHomework(id),
    ]);
    user = me;
    studentName = `${student.firstName} ${student.lastName ?? ""}`.trim();
    homework = list.find((h) => h.id === hwId);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  if (!homework) notFound();

  return (
    <DashboardShell role="CURATOR" name={user.firstName}>
      <div className="mx-auto flex max-w-[640px] flex-col gap-5">
        <Link href={`/curator/students/${id}`} className="text-[14px] font-semibold text-muted hover:text-ink">
          ← {studentName}
        </Link>
        <h1 className="display text-[22px]">{homework.title}</h1>
        <HomeworkReview homework={homework} studentId={id} />
      </div>
    </DashboardShell>
  );
}
