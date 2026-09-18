"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import type { CefrTarget, LinkCode, MeResponse } from "@/lib/types";

export interface ProfileFormState {
  error: string | null;
}

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const targetLevel = formData.get("targetLevel");
  const goal = formData.get("goal");
  const dailyMinutes = formData.get("dailyMinutes");

  const payload: { targetLevel?: CefrTarget; goal?: string; dailyMinutes?: number } = {};
  if (typeof targetLevel === "string" && targetLevel) payload.targetLevel = targetLevel as CefrTarget;
  if (typeof goal === "string") payload.goal = goal.trim();
  if (typeof dailyMinutes === "string" && dailyMinutes) payload.dailyMinutes = Number(dailyMinutes);

  try {
    await apiFetch<MeResponse>("/users/me", { method: "PATCH", body: JSON.stringify(payload) });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось сохранить изменения" };
  }

  revalidatePath("/student");
  return { error: null };
}

export async function createLinkCode(): Promise<LinkCode> {
  return apiFetch<LinkCode>("/students/me/link-code", { method: "POST" });
}
