"use server";

import { apiFetch } from "@/lib/api";
import type { CompleteBlockResult, LessonPlayerData, PlacementPresign, SubmitAnswerResult } from "@/lib/types";

export async function getLesson(lessonId: string) {
  return apiFetch<LessonPlayerData>(`/learning/lessons/${lessonId}`);
}

export async function submitExerciseAnswer(lessonId: string, exerciseId: string, answer: unknown) {
  return apiFetch<SubmitAnswerResult>(`/learning/lessons/${lessonId}/exercises/${exerciseId}/answers`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export async function presignLessonSpeaking(lessonId: string, exerciseId: string, fileName: string, contentType: string) {
  return apiFetch<PlacementPresign>(`/learning/lessons/${lessonId}/exercises/${exerciseId}/speaking-presign`, {
    method: "POST",
    body: JSON.stringify({ fileName, contentType }),
  });
}

export async function submitLessonSpeaking(lessonId: string, exerciseId: string, audioKey: string) {
  return apiFetch<{ submitted: boolean }>(`/learning/lessons/${lessonId}/exercises/${exerciseId}/speaking`, {
    method: "POST",
    body: JSON.stringify({ audioKey }),
  });
}

export async function completeBlock(lessonId: string, blockId: string) {
  return apiFetch<CompleteBlockResult>(`/learning/lessons/${lessonId}/blocks/${blockId}/complete`, { method: "POST" });
}

export async function sendHeartbeat(lessonId: string, seconds: number) {
  return apiFetch<{ activeSeconds: number }>(`/learning/lessons/${lessonId}/heartbeat`, {
    method: "POST",
    body: JSON.stringify({ seconds }),
  });
}
