import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api";
import type { MeResponse } from "@/lib/types";
import { getMyHomework } from "../../homework-actions";
import { HomeworkDetail } from "./HomeworkDetail";

export default async function HomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, list] = await Promise.all([apiFetch<MeResponse>("/users/me"), getMyHomework()]);
  const homework = list.find((h) => h.id === id);
  if (!homework) notFound();
  const hasVoiceConsent = user.activeConsents.some((c) => c.type === "VOICE_RECORDING");

  return (
    <DashboardShell role="STUDENT" name={user.firstName}>
      <HomeworkDetail homework={homework} hasVoiceConsent={hasVoiceConsent} />
    </DashboardShell>
  );
}
