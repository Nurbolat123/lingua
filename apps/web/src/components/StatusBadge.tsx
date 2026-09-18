type Status = "ACTIVE" | "PENDING_CONSENT" | "BLOCKED";

const STATUS_LABEL: Record<Status, string> = {
  ACTIVE: "Активен",
  PENDING_CONSENT: "Ждёт согласия",
  BLOCKED: "Заблокирован",
};

const STATUS_CLASS: Record<Status, string> = {
  ACTIVE: "bg-lime text-ink",
  PENDING_CONSENT: "bg-paper-2 text-ink-2",
  BLOCKED: "bg-error text-white",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${STATUS_CLASS[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
