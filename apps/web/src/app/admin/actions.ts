"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";
import type { PublicUser, Role, UserStatus } from "@/lib/types";

export interface CreateStaffState {
  error: string | null;
}

export async function createStaff(
  _prevState: CreateStaffState,
  formData: FormData,
): Promise<CreateStaffState> {
  const payload = {
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || undefined,
    role: formData.get("role") as Role,
  };

  try {
    await apiFetch<PublicUser>("/admin/users", { method: "POST", body: JSON.stringify(payload) });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Не удалось создать сотрудника" };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function setUserStatus(userId: string, status: UserStatus) {
  await apiFetch(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/admin");
}

export async function assignCurator(formData: FormData) {
  const studentId = formData.get("studentId");
  const curatorId = formData.get("curatorId");
  if (!curatorId) return;
  await apiFetch("/admin/curator-assignments", {
    method: "POST",
    body: JSON.stringify({ studentId, curatorId }),
  });
  revalidatePath("/admin");
}
