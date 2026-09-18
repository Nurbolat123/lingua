"use client";

import { useRef, useState } from "react";
import { presignUpload } from "./uploadActions";

const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"];

export function AudioUploadField({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Поддерживаются только MP3, WAV, OGG, M4A");
      setStatus("error");
      return;
    }
    setStatus("uploading");
    setError(null);
    try {
      const { uploadUrl, fileUrl } = await presignUpload(file.name, file.type);
      let res: Response;
      try {
        res = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      } catch {
        throw new Error("Не удалось соединиться с хранилищем файлов (MinIO). Проверьте, что оно запущено.");
      }
      if (!res.ok) throw new Error(`Хранилище ответило ошибкой ${res.status}`);
      setUrl(fileUrl);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить файл.");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-[13px]"
        />
        {status === "uploading" && <span className="text-[13px] text-muted">Загружаем…</span>}
      </div>
      <input type="hidden" name={name} value={url} />
      {url && (
        <div className="flex items-center gap-2">
          <audio controls src={url} className="h-8" />
          <button type="button" onClick={() => setUrl("")} className="text-[12px] text-error">
            Убрать
          </button>
        </div>
      )}
      {error && <p className="text-[12px] font-semibold text-error">{error}</p>}
    </div>
  );
}
