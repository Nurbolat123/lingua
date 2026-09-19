"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExerciseCard } from "@/components/ExerciseCard";
import { SpeakingRecorder } from "@/components/SpeakingRecorder";
import type { LessonBlockType, LessonPlayerData } from "@/lib/types";
import {
  completeBlock, presignLessonSpeaking, sendHeartbeat, submitExerciseAnswer, submitLessonSpeaking,
} from "./actions";

const BLOCK_LABELS: Record<LessonBlockType, string> = {
  INTRO: "Введение",
  VOCABULARY: "Новые слова",
  GRAMMAR: "Грамматика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  EXERCISE: "Упражнения",
  SPEAKING: "Говорение",
  MINI_TEST: "Мини-тест",
  HOMEWORK: "Домашнее задание",
};

const HEARTBEAT_SECONDS = 15;
const IDLE_LIMIT_MS = 30_000;

export function LessonPlayer({ lessonId, initialLesson }: { lessonId: string; initialLesson: LessonPlayerData }) {
  const [blockOrder, setBlockOrder] = useState(initialLesson.progress.currentBlockOrder);
  const [finished, setFinished] = useState(initialLesson.progress.status === "COMPLETED");
  const [answered, setAnswered] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const block of initialLesson.blocks) {
      for (const ex of block.exercises) {
        if (ex.answer && (ex.answer.isCorrect !== null || ex.answer.hasAudio)) map[ex.id] = true;
      }
    }
    return map;
  });
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastInteraction = useRef(0);
  useEffect(() => {
    const bump = () => {
      lastInteraction.current = Date.now();
    };
    bump();
    window.addEventListener("pointerdown", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("scroll", bump);
    return () => {
      window.removeEventListener("pointerdown", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("scroll", bump);
    };
  }, []);

  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => {
      const active = document.visibilityState === "visible" && Date.now() - lastInteraction.current < IDLE_LIMIT_MS;
      if (active) sendHeartbeat(lessonId, HEARTBEAT_SECONDS).catch(() => undefined);
    }, HEARTBEAT_SECONDS * 1000);
    return () => clearInterval(id);
  }, [lessonId, finished]);

  const block = initialLesson.blocks.find((b) => b.order === blockOrder);
  const totalBlocks = initialLesson.blocks.length;

  const markAnswered = useCallback((exerciseId: string) => {
    setAnswered((prev) => ({ ...prev, [exerciseId]: true }));
  }, []);

  async function handleContinue() {
    if (!block) return;
    setAdvancing(true);
    setError(null);
    try {
      const res = await completeBlock(lessonId, block.id);
      if (res.status === "COMPLETED") setFinished(true);
      else setBlockOrder(res.currentBlockOrder);
    } catch {
      setError("Не удалось сохранить прогресс. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setAdvancing(false);
    }
  }

  if (finished || !block) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-12">
        <div className="w-full max-w-[480px] rounded-3xl border border-line bg-card p-9 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime text-[24px]">✓</div>
          <h1 className="display mt-4 text-[26px]">Урок завершён</h1>
          <p className="mt-2 text-muted">{initialLesson.title}</p>
          <Link
            href="/student"
            className="mt-6 inline-flex h-[48px] items-center justify-center rounded-2xl bg-ink px-6 text-[15px] font-semibold text-paper"
          >
            В кабинет
          </Link>
        </div>
      </main>
    );
  }

  const gradableExercises = block.exercises.filter((ex) => ex.type !== "SPEAKING" && ex.type !== "FREE_RESPONSE");
  const speakingExercises = block.exercises.filter((ex) => ex.type === "SPEAKING");
  const allAnswered = block.exercises.every((ex) => answered[ex.id]);

  return (
    <main className="min-h-screen bg-paper px-5 py-10">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div>
          <div className="flex items-center justify-between text-[14px] font-semibold text-muted">
            <Link href="/student" className="hover:text-ink">
              ← В кабинет
            </Link>
            <span>
              {BLOCK_LABELS[block.type]} · {blockOrder + 1} / {totalBlocks}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2">
            <span
              className="block h-full rounded-full bg-blue transition-[width]"
              style={{ width: `${((blockOrder + 1) / totalBlocks) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-card p-7">
          <h1 className="display text-[22px]">{block.title ?? BLOCK_LABELS[block.type]}</h1>

          <div className="mt-5 flex flex-col gap-5">
            {"text" in block.content && typeof block.content.text === "string" && (
              <p className="text-[16px] leading-relaxed">{block.content.text}</p>
            )}
            {"explanation" in block.content && typeof block.content.explanation === "string" && (
              <p className="text-[16px] leading-relaxed">{block.content.explanation}</p>
            )}
            {"audioUrl" in block.content && typeof block.content.audioUrl === "string" && (
              <audio controls src={block.content.audioUrl} className="w-full" />
            )}
            {"transcript" in block.content && typeof block.content.transcript === "string" && (
              <p className="rounded-2xl bg-paper-2 p-4 text-[15px] leading-relaxed">{block.content.transcript}</p>
            )}
            {"words" in block.content && Array.isArray(block.content.words) && (
              <ul className="flex flex-wrap gap-2">
                {(block.content.words as string[]).map((w) => (
                  <li key={w} className="rounded-full border border-line bg-white px-4 py-2 text-[15px]">
                    {w}
                  </li>
                ))}
              </ul>
            )}

            {gradableExercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                initialAnswer={ex.answer}
                onSubmit={async (answer) => {
                  const res = await submitExerciseAnswer(lessonId, ex.id, answer);
                  markAnswered(ex.id);
                  return res;
                }}
              />
            ))}

            {speakingExercises.map((ex) =>
              answered[ex.id] ? (
                <div key={ex.id} className="rounded-2xl border border-line bg-lime/20 p-4 text-[15px] font-semibold">
                  Запись отправлена
                </div>
              ) : (
                <SpeakingRecorder
                  key={ex.id}
                  prompt={String(ex.content.prompt ?? "")}
                  onPresign={(fileName, contentType) => presignLessonSpeaking(lessonId, ex.id, fileName, contentType)}
                  onSubmit={async (audioKey) => {
                    await submitLessonSpeaking(lessonId, ex.id, audioKey);
                    markAnswered(ex.id);
                  }}
                />
              ),
            )}

            <button
              type="button"
              disabled={!allAnswered || advancing}
              onClick={handleContinue}
              className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper disabled:opacity-40"
            >
              {advancing ? "Сохраняем…" : "Продолжить"}
            </button>
          </div>
        </div>

        {error && <p className="text-[14px] font-semibold text-error">{error}</p>}
      </div>
    </main>
  );
}
