"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SpeakingRecorder } from "@/components/SpeakingRecorder";
import type { Homework } from "@/lib/types";
import { presignHomeworkAudio, submitHomework } from "../../homework-actions";

const STATUS_LABEL: Record<Homework["status"], string> = {
  ASSIGNED: "Ждёт выполнения",
  SUBMITTED: "На проверке у куратора",
  REVIEWED: "Проверено",
  RETURNED: "Возвращено на доработку",
};

const RUBRIC_LABEL: Record<string, string> = {
  vocabulary: "Словарный запас",
  grammar: "Грамматика",
  fluency: "Беглость речи",
  pronunciation: "Произношение",
};

export function HomeworkDetail({ homework, hasVoiceConsent }: { homework: Homework; hasVoiceConsent: boolean }) {
  const [text, setText] = useState(homework.submissionText ?? "");
  const [audioKey, setAudioKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tabAwayCount = useRef(0);
  const fullscreenExitCount = useRef(0);
  const pasteDetected = useRef(false);

  useEffect(() => {
    if (!homework.requiresIntegrityCheck) return;
    function onVisibility() {
      if (document.visibilityState === "hidden") tabAwayCount.current += 1;
    }
    function onFullscreenChange() {
      if (!document.fullscreenElement) fullscreenExitCount.current += 1;
    }
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [homework.requiresIntegrityCheck]);

  const canSubmit = homework.status === "ASSIGNED" || homework.status === "RETURNED";

  async function handleSubmit() {
    if (!text.trim() && !audioKey) {
      setError("Добавьте текстовый ответ или запись голоса.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitHomework(homework.id, {
        text: text.trim() || undefined,
        audioKey: audioKey ?? undefined,
        integritySignals: homework.requiresIntegrityCheck
          ? {
              tabAwayCount: tabAwayCount.current,
              fullscreenExitCount: fullscreenExitCount.current,
              pasteDetected: pasteDetected.current,
            }
          : undefined,
      });
      setDone(true);
    } catch {
      setError("Не удалось отправить задание. Попробуйте ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-6">
      <Link href="/student" className="text-[14px] font-semibold text-muted hover:text-ink">
        ← В кабинет
      </Link>

      <div className="rounded-3xl border border-line bg-card p-7">
        <div className="flex items-start justify-between gap-4">
          <h1 className="display text-[22px]">{homework.title}</h1>
          <span className="shrink-0 rounded-full bg-paper-2 px-3 py-1 text-[13px] font-semibold text-ink">
            {STATUS_LABEL[homework.status]}
          </span>
        </div>

        {homework.instructions && <p className="mt-3 text-[16px] leading-relaxed">{homework.instructions}</p>}
        {homework.dueAt && (
          <p className="mt-2 text-[14px] text-muted">Срок: {new Date(homework.dueAt).toLocaleDateString("ru-RU")}</p>
        )}

        {homework.status === "RETURNED" && homework.reviewComment && (
          <div className="mt-5 rounded-2xl bg-paper-2 p-4">
            <p className="text-[14px] font-semibold">Комментарий куратора</p>
            <p className="mt-1 text-[15px]">{homework.reviewComment}</p>
          </div>
        )}

        {(homework.status === "REVIEWED") && (
          <div className="mt-5 rounded-2xl bg-paper-2 p-4">
            {homework.reviewComment && <p className="text-[15px]">{homework.reviewComment}</p>}
            {homework.rubric && (
              <dl className="mt-3 flex flex-col gap-1.5">
                {Object.entries(homework.rubric).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[14px]">
                    <dt className="text-muted">{RUBRIC_LABEL[k] ?? k}</dt>
                    <dd className="font-semibold">{v} / 5</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}

        {canSubmit && !done && (
          <div className="mt-6 flex flex-col gap-5">
            <div>
              <label htmlFor="hw-text" className="mb-1.5 block text-[14px] font-semibold">
                Текстовый ответ
              </label>
              <textarea
                id="hw-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={() => {
                  pasteDetected.current = true;
                }}
                rows={5}
                className="w-full rounded-2xl border border-line bg-paper px-4 py-3 text-[15px]"
                placeholder="Напишите ответ здесь…"
              />
            </div>

            {audioKey ? (
              <p className="text-[14px] font-semibold text-blue">Запись голоса прикреплена ✓</p>
            ) : hasVoiceConsent ? (
              <SpeakingRecorder
                prompt="Можно также ответить голосом (необязательно)"
                onPresign={(fileName, contentType) => presignHomeworkAudio(homework.id, fileName, contentType)}
                onSubmit={async (key) => {
                  setAudioKey(key);
                }}
              />
            ) : (
              <p className="text-[14px] text-muted">
                Чтобы отвечать голосом, нужно согласие на запись голоса — его можно дать в настройках профиля
                (для несовершеннолетних — родитель в своём кабинете).
              </p>
            )}

            {error && <p className="text-[14px] font-semibold text-error">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper disabled:opacity-40"
            >
              {submitting ? "Отправляем…" : "Отправить домашнее задание"}
            </button>
          </div>
        )}

        {(homework.status === "SUBMITTED" || done) && (
          <p className="mt-6 text-[15px] text-muted">Ответ отправлен, ждите проверки куратора.</p>
        )}
      </div>
    </div>
  );
}
