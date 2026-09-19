import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api";
import type { PublicUser } from "@/lib/types";
import { getNotificationSettings, getTelegramStatus } from "./actions";
import { NotificationSettingsForm } from "./NotificationSettingsForm";
import { TelegramLink } from "./TelegramLink";

export default async function NotificationsPage() {
  const [user, settings, telegramStatus] = await Promise.all([
    apiFetch<PublicUser>("/users/me"),
    getNotificationSettings(),
    getTelegramStatus(),
  ]);

  return (
    <DashboardShell role={user.role} name={user.firstName} title="Уведомления">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div>
          <p className="mb-3 text-[15px] font-semibold">Telegram</p>
          <TelegramLink initial={telegramStatus} />
        </div>

        <div>
          <p className="mb-3 text-[15px] font-semibold">Настройки уведомлений</p>
          <NotificationSettingsForm initial={settings} />
        </div>
      </div>
    </DashboardShell>
  );
}
