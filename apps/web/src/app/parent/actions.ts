"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import type { ConsentType } from "@/lib/types";

export interface LinkChildState {
  error: string | null;
}

export async function linkChild(_prevState: LinkChildState, formData: FormData): Promise<LinkChildState> {
  const code = formData.get("code");
  if (typeof code !== "string" || code.trim().length !== 8) {
    return { error: "Код состоит из 8 символов" };
  }

  try {
    await apiFetch("/parents/children/link", {
      method: "POST",
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось привязать ребёнка" };
  }

  revalidatePath("/parent");
  return { error: null };
}

export async function unlinkChild(childId: string) {
  await apiFetch(`/parents/children/${childId}`, { method: "DELETE" });
  revalidatePath("/parent");
}

export async function setConsent(childId: string, type: ConsentType, grant: boolean) {
  if (grant) {
    await apiFetch(`/parents/children/${childId}/consents`, {
      method: "POST",
      body: JSON.stringify({ type }),
    });
  } else {
    await apiFetch(`/parents/children/${childId}/consents/${type}`, { method: "DELETE" });
  }
  revalidatePath("/parent");
}
