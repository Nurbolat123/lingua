"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import type {
  PlacementAnswerResult,
  PlacementAttemptState,
  PlacementNextQuestion,
  PlacementPresign,
} from "@/lib/types";

/** Начинает попытку (анонимно или от имени вошедшего пользователя) и сразу переходит к тесту. */
export async function startPlacementAttempt() {
  const attempt = await apiFetch<PlacementAttemptState>("/placement/attempts", { method: "POST" });
  redirect(`/test/${attempt.id}`);
}

export async function getPlacementState(id: string) {
  return apiFetch<PlacementAttemptState>(`/placement/attempts/${id}`);
}

export async function getNextQuestion(id: string) {
  return apiFetch<PlacementNextQuestion>(`/placement/attempts/${id}/next-question`);
}

export async function submitPlacementAnswer(id: string, questionId: string, answer: unknown) {
  return apiFetch<PlacementAnswerResult>(`/placement/attempts/${id}/answers`, {
    method: "POST",
    body: JSON.stringify({ questionId, answer }),
  });
}

export async function presignSpeaking(id: string, fileName: string, contentType: string) {
  return apiFetch<PlacementPresign>(`/placement/attempts/${id}/speaking/presign`, {
    method: "POST",
    body: JSON.stringify({ fileName, contentType }),
  });
}

export async function submitPlacementSpeaking(id: string, questionId: string, audioKey: string) {
  return apiFetch<PlacementAnswerResult>(`/placement/attempts/${id}/speaking`, {
    method: "POST",
    body: JSON.stringify({ questionId, audioKey }),
  });
}

/** Привязывает анонимную завершённую попытку к вошедшему пользователю. Безопасно вызывать повторно. */
export async function claimPlacementAttempt(id: string): Promise<PlacementAttemptState | null> {
  try {
    return await apiFetch<PlacementAttemptState>(`/placement/attempts/${id}/claim`, { method: "POST" });
  } catch (e) {
    if (e instanceof ApiError) return null;
    throw e;
  }
}
