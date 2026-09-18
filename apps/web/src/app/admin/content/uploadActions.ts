"use server";

import { apiFetch } from "@/lib/api";

export interface PresignResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
}

/** Только для аудио/картинок учебного контента — не для приватных записей речи учеников. */
export async function presignUpload(fileName: string, contentType: string): Promise<PresignResult> {
  return apiFetch<PresignResult>("/admin/content/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ fileName, contentType }),
  });
}
