"use server";

import { apiFetch } from "@/lib/api";
import type {
  NotificationListResponse, NotificationSettingRow, NotificationType, TelegramLinkCode, TelegramStatus,
} from "@/lib/types";

export async function getNotifications() {
  return apiFetch<NotificationListResponse>("/notifications");
}

export async function markNotificationRead(id: string) {
  return apiFetch(`/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead() {
  return apiFetch("/notifications/read-all", { method: "POST" });
}

export async function getNotificationSettings() {
  return apiFetch<NotificationSettingRow[]>("/notifications/settings");
}

export async function updateNotificationSetting(
  type: NotificationType,
  data: { inApp?: boolean; email?: boolean; telegram?: boolean },
) {
  return apiFetch(`/notifications/settings/${type}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function getTelegramStatus() {
  return apiFetch<TelegramStatus>("/notifications/telegram/status");
}

export async function createTelegramLinkCode() {
  return apiFetch<TelegramLinkCode>("/notifications/telegram/link-code", { method: "POST" });
}

export async function unlinkTelegram() {
  return apiFetch("/notifications/telegram/link", { method: "DELETE" });
}
