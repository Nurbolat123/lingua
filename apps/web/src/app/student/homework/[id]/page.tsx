import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import { getMyHomework } from "../../homework-actions";
import { HomeworkDetail } from "./HomeworkDetail";

export default async function HomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, list] = await Promise.all([apiFetch<PublicUser>("/users/me"), getMyHomework()]);
  const homework = list.find((h) => h.id === id);
  if (!homework) notFound();

  return (
    <DashboardShell role="STUDENT" name={user.firstName}>
      <HomeworkDetail homework={homework} />
    </DashboardShell>
  );
}
