"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/app/notifications/actions";
import type { AppNotification } from "@/lib/types";

const POLL_MS = 30_000;

export function NotificationBell() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await getNotifications();
        if (!ignore) {
          setItems(res.items);
          setUnread(res.unread);
        }
      } catch {
        // тихо игнорируем — колокольчик не должен ломать страницу
      }
    }
    const interval = setInterval(load, POLL_MS);
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    load();
    return () => {
      ignore = true;
      clearInterval(interval);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleItemClick(n: AppNotification) {
    if (!n.readAt) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)));
      setUnread((u) => Math.max(0, u - 1));
      await markNotificationRead(n.id);
    }
  }

  async function handleMarkAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await markAllNotificationsRead();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Уведомления"
        className="relative grid h-10 w-10 place-items-center rounded-full border border-line text-ink hover:border-blue"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-error px-1 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[340px] max-w-[90vw] rounded-2xl border border-line bg-card p-3 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-[14px] font-semibold">Уведомления</p>
            {unread > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-[13px] font-semibold text-blue">
                Прочитать все
              </button>
            )}
          </div>
          <div className="mt-1 max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-2 py-4 text-[14px] text-muted">Пока нет уведомлений.</p>
            ) : (
              items.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] ${n.readAt ? "" : "bg-paper-2"}`}
                >
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="mt-0.5 text-muted">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted">{new Date(n.createdAt).toLocaleString("ru-RU")}</p>
                </button>
              ))
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="mt-2 block px-2 py-1.5 text-[13px] font-semibold text-blue">
            Настройки уведомлений →
          </Link>
        </div>
      )}
    </div>
  );
}
