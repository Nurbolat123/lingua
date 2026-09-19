"use server";

import { apiFetch } from "@/lib/api";
import type { Homework, IntegritySignals } from "@/lib/types";

export async function getMyHomework() {
  return apiFetch<Homework[]>("/learning/homework");
}

export async function presignHomeworkAudio(homeworkId: string, fileName: string, contentType: string) {
  return apiFetch<{ uploadUrl: string; key: string }>(`/learning/homework/${homeworkId}/speaking-presign`, {
    method: "POST",
    body: JSON.stringify({ fileName, contentType }),
  });
}

export async function submitHomework(
  homeworkId: string,
  data: { text?: string; audioKey?: string; integritySignals?: IntegritySignals },
) {
  return apiFetch<Homework>(`/learning/homework/${homeworkId}/submit`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
