"use client";

import { useState } from "react";

export function AudioPlayer({ label, fetchUrl }: { label: string; fetchUrl: () => Promise<{ url: string }> }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleListen() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUrl();
      setUrl(res.url);
    } catch {
      setError("Не удалось загрузить запись.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="text-[14px] font-semibold">{label}</p>
      {url ? (
        <audio controls src={url} className="mt-2 w-full" />
      ) : (
        <button
          type="button"
          onClick={handleListen}
          disabled={loading}
          className="mt-2 h-[40px] rounded-2xl border border-ink px-4 text-[14px] font-semibold text-ink disabled:opacity-40"
        >
          {loading ? "Загружаем…" : "Прослушать"}
        </button>
      )}
      {error && <p className="mt-2 text-[13px] font-semibold text-error">{error}</p>}
    </div>
  );
}
