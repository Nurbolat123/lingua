"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-full border border-ink px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-60"
    >
      {loading ? "Выходим…" : "Выйти"}
    </button>
  );
}
