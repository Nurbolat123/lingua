"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  CuratorStudent, CuratorStudentCard, Homework, MistakeItem, PlacementSpeakingRecording, ReviewQueueItem,
  SkillSnapshot, SpeakingRecordingsResponse, SpeakingRubric,
} from "@/lib/types";

function buildQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function getMyStudents(filters: { inactiveDays?: string; lowScore?: boolean; hasPending?: boolean }) {
  return apiFetch<CuratorStudent[]>(
    `/curator/students${buildQuery({
      inactiveDays: filters.inactiveDays,
      lowScore: filters.lowScore ? "true" : undefined,
      hasPending: filters.hasPending ? "true" : undefined,
    })}`,
  );
}

export async function getReviewQueue() {
  return apiFetch<ReviewQueueItem[]>("/curator/review-queue");
}

export async function getStudentCard(studentId: string) {
  return apiFetch<CuratorStudentCard>(`/curator/students/${studentId}`);
}

export async function getStudentSkillHistory(studentId: string) {
  return apiFetch<SkillSnapshot[]>(`/students/${studentId}/skill-history`);
}

export async function getStudentMistakes(studentId: string) {
  return apiFetch<MistakeItem[]>(`/curator/students/${studentId}/mistakes`);
}

export async function getStudentRecordings(studentId: string) {
  return apiFetch<SpeakingRecordingsResponse>(`/curator/students/${studentId}/speaking-recordings`);
}

export async function getStudentHomework(studentId: string) {
  return apiFetch<Homework[]>(`/curator/students/${studentId}/homework`);
}

export interface PlanFormState {
  error: string | null;
}

export async function updateStudentPlan(studentId: string, _prevState: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const targetLevel = formData.get("targetLevel");
  const goal = formData.get("goal");
  const payload: { targetLevel?: string; goal?: string } = {};
  if (typeof targetLevel === "string" && targetLevel) payload.targetLevel = targetLevel;
  if (typeof goal === "string") payload.goal = goal.trim();

  try {
    await apiFetch(`/curator/students/${studentId}/plan`, { method: "PATCH", body: JSON.stringify(payload) });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось сохранить" };
  }
  revalidatePath(`/curator/students/${studentId}`);
  return { error: null };
}

export interface AssignHomeworkState {
  error: string | null;
}

export async function assignHomework(studentId: string, _prevState: AssignHomeworkState, formData: FormData): Promise<AssignHomeworkState> {
  const title = formData.get("title");
  const instructions = formData.get("instructions");
  const dueAt = formData.get("dueAt");
  const requiresIntegrityCheck = formData.get("requiresIntegrityCheck") === "on";

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Укажите название задания" };
  }

  try {
    await apiFetch("/curator/homework", {
      method: "POST",
      body: JSON.stringify({
        studentId,
        title: title.trim(),
        instructions: typeof instructions === "string" && instructions.trim() ? instructions.trim() : undefined,
        dueAt: typeof dueAt === "string" && dueAt ? new Date(dueAt).toISOString() : undefined,
        requiresIntegrityCheck,
      }),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось назначить задание" };
  }
  revalidatePath(`/curator/students/${studentId}`);
  return { error: null };
}

export async function getHomeworkListenUrl(homeworkId: string) {
  return apiFetch<{ url: string }>(`/curator/homework/${homeworkId}/listen`);
}

export async function reviewHomework(
  homeworkId: string,
  studentId: string,
  data: { action: "APPROVE" | "RETURN"; rubric?: SpeakingRubric; comment?: string },
) {
  const result = await apiFetch<Homework>(`/curator/homework/${homeworkId}/review`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/curator");
  revalidatePath(`/curator/students/${studentId}`);
  return result;
}

export async function getPlacementRecordings(attemptId: string) {
  return apiFetch<PlacementSpeakingRecording[]>(`/curator/placement-attempts/${attemptId}/recordings`);
}

export async function reviewPlacementSpeaking(attemptId: string, studentId: string, data: { rubric: SpeakingRubric; comment?: string }) {
  const result = await apiFetch(`/curator/placement-attempts/${attemptId}/review-speaking`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/curator");
  revalidatePath(`/curator/students/${studentId}`);
  return result;
}

export async function getLessonRecording(answerId: string) {
  return apiFetch<{ url: string }>(`/curator/lesson-answers/${answerId}/recording`);
}

export async function reviewLessonSpeaking(answerId: string, studentId: string, data: { rubric: SpeakingRubric; comment?: string }) {
  const result = await apiFetch(`/curator/lesson-answers/${answerId}/review-speaking`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  revalidatePath("/curator");
  revalidatePath(`/curator/students/${studentId}`);
  return result;
}
