"use client";

import { useRef, useState } from "react";

const MIME_CANDIDATES = ["audio/webm", "audio/ogg", "audio/mp4"];

function pickMimeType(): string {
  if (typeof MediaRecorder !== "undefined") {
    for (const type of MIME_CANDIDATES) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
  }
  return "audio/webm";
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

export function SpeakingRecorder({
  prompt,
  onPresign,
  onSubmit,
}: {
  prompt: string;
  onPresign: (fileName: string, contentType: string) => Promise<{ uploadUrl: string; key: string }>;
  onSubmit: (audioKey: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const mimeRef = useRef<string>("audio/webm");

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      setError("Не удалось получить доступ к микрофону. Проверьте разрешения браузера.");
      setStatus("error");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function reRecord() {
    setAudioUrl(null);
    blobRef.current = null;
    setError(null);
    setStatus("idle");
  }

  async function submit() {
    if (!blobRef.current) return;
    setStatus("uploading");
    setError(null);
    try {
      const ext = extensionFor(mimeRef.current);
      const { uploadUrl, key } = await onPresign(`answer.${ext}`, mimeRef.current);
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeRef.current },
        body: blobRef.current,
      });
      if (!res.ok) throw new Error("upload failed");
      await onSubmit(key);
    } catch {
      setError(
        "Не удалось отправить запись. Проверьте соединение с хранилищем файлов и попробуйте ещё раз.",
      );
      setStatus("recorded");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-2xl bg-blue px-5 py-4 text-white">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-ink">🎤</span>
        <span className="text-[16px] font-medium">{prompt}</span>
      </div>

      {status === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper"
        >
          Начать запись
        </button>
      )}
      {status === "recording" && (
        <button
          type="button"
          onClick={stopRecording}
          className="h-[52px] animate-pulse rounded-2xl bg-error text-[16px] font-semibold text-white"
        >
          Остановить запись
        </button>
      )}
      {(status === "recorded" || status === "uploading") && audioUrl && (
        <div className="flex flex-col gap-3">
          <audio controls src={audioUrl} className="w-full" />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reRecord}
              disabled={status === "uploading"}
              className="h-[48px] flex-1 rounded-2xl border border-ink text-[15px] font-semibold text-ink disabled:opacity-40"
            >
              Записать заново
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={status === "uploading"}
              className="h-[48px] flex-1 rounded-2xl bg-ink text-[15px] font-semibold text-paper disabled:opacity-40"
            >
              {status === "uploading" ? "Отправляем…" : "Отправить ответ"}
            </button>
          </div>
        </div>
      )}
      {status === "error" && !audioUrl && (
        <button
          type="button"
          onClick={startRecording}
          className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper"
        >
          Попробовать снова
        </button>
      )}
      {error && <p className="text-[14px] font-semibold text-error">{error}</p>}
    </div>
  );
}
