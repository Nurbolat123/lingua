"use server";

import { apiFetch } from "@/lib/api";
import type { DueVocabularyWord, SkillSnapshot, SubmitAnswerResult, TodayPlan } from "@/lib/types";

export async function getTodayPlan() {
  return apiFetch<TodayPlan>("/learning/today-plan");
}

export async function getSkillHistory(studentId: string) {
  return apiFetch<SkillSnapshot[]>(`/students/${studentId}/skill-history`);
}

export async function submitPracticeAnswer(questionId: string, answer: unknown) {
  return apiFetch<SubmitAnswerResult>(`/learning/practice/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export async function getDueVocabulary() {
  return apiFetch<DueVocabularyWord[]>("/learning/vocabulary/due");
}

export async function reviewVocabulary(id: string, quality: number) {
  return apiFetch<{ nextReviewInDays: number }>(`/learning/vocabulary/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ quality }),
  });
}
