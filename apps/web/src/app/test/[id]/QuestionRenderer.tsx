"use client";

import { useState } from "react";
import type { PlacementQuestion } from "@/lib/types";

type Props = {
  question: PlacementQuestion;
  submitting: boolean;
  onSubmit: (answer: unknown) => void;
};

export function QuestionRenderer({ question, submitting, onSubmit }: Props) {
  const content = question.content;

  switch (question.type) {
    case "MULTIPLE_CHOICE":
      return <MultipleChoice content={content} submitting={submitting} onSubmit={onSubmit} />;
    case "FILL_BLANK":
      return <FillBlank content={content} submitting={submitting} onSubmit={onSubmit} />;
    case "MATCHING":
      return <Matching content={content} submitting={submitting} onSubmit={onSubmit} />;
    case "ORDERING":
      return <Ordering content={content} submitting={submitting} onSubmit={onSubmit} />;
    default:
      return <p className="text-muted">Этот тип вопроса пока не поддерживается.</p>;
  }
}

type PartProps = { content: Record<string, unknown>; submitting: boolean; onSubmit: (answer: unknown) => void };

function MultipleChoice({ content, submitting, onSubmit }: PartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const audioUrl = content.audioUrl as string | undefined;
  const transcript = content.transcript as string | undefined;
  // Пассаж для Reading всегда показываем; транскрипт Listening — только если нет аудио
  // (иначе это уже не аудирование, а чтение того же текста).
  const passage = (content.passage as string | undefined) ?? (audioUrl ? undefined : transcript);
  const options = (content.options as string[] | undefined) ?? [];

  return (
    <div className="flex flex-col gap-5">
      {audioUrl && <audio controls src={audioUrl} className="w-full" />}
      {passage && <p className="rounded-2xl bg-paper-2 p-4 text-[15px] leading-relaxed">{passage}</p>}
      <p className="text-[18px] font-semibold">{String(content.question ?? "")}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={`rounded-2xl border px-4 py-3 text-left text-[16px] transition-colors ${
              selected === i ? "border-blue bg-blue/5 font-semibold" : "border-line bg-white hover:border-ink"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={selected === null || submitting}
        onClick={() => selected !== null && onSubmit(selected)}
        className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper disabled:opacity-40"
      >
        {submitting ? "Отправляем…" : "Ответить"}
      </button>
    </div>
  );
}

function FillBlank({ content, submitting, onSubmit }: PartProps) {
  const [value, setValue] = useState("");
  const text = String(content.text ?? "");
  const parts = text.split("___");

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[18px] font-semibold leading-relaxed">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus={i === 0}
                className="mx-1 inline-block w-32 rounded-lg border border-line px-2 py-1 text-[16px] align-baseline focus:border-blue focus:outline-none"
              />
            )}
          </span>
        ))}
      </p>
      <button
        type="button"
        disabled={!value.trim() || submitting}
        onClick={() => onSubmit(value.trim())}
        className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper disabled:opacity-40"
      >
        {submitting ? "Отправляем…" : "Ответить"}
      </button>
    </div>
  );
}

function Matching({ content, submitting, onSubmit }: PartProps) {
  const left = (content.left as string[] | undefined) ?? [];
  const right = (content.right as string[] | undefined) ?? [];
  const [pairs, setPairs] = useState<Record<number, string>>({});

  const allMatched = left.length > 0 && left.every((_, i) => pairs[i]);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[16px] font-semibold text-muted">Подберите пару для каждого слова</p>
      <div className="flex flex-col gap-3">
        {left.map((l, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-1/2 rounded-xl border border-line bg-white px-3 py-2 text-[15px]">{l}</span>
            <select
              value={pairs[i] ?? ""}
              onChange={(e) => setPairs((p) => ({ ...p, [i]: e.target.value }))}
              className="w-1/2 rounded-xl border border-line px-3 py-2 text-[15px] focus:border-blue focus:outline-none"
            >
              <option value="" disabled>
                Выберите…
              </option>
              {right.map((r, j) => (
                <option key={j} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={!allMatched || submitting}
        onClick={() => onSubmit(left.map((l, i) => ({ left: l, right: pairs[i] })))}
        className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper disabled:opacity-40"
      >
        {submitting ? "Отправляем…" : "Ответить"}
      </button>
    </div>
  );
}

function Ordering({ content, submitting, onSubmit }: PartProps) {
  const tokens = (content.tokens as string[] | undefined) ?? [];
  const [order, setOrder] = useState<number[]>([]);

  const pool = tokens.map((t, i) => ({ t, i })).filter(({ i }) => !order.includes(i));

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[16px] font-semibold text-muted">Составьте предложение по порядку</p>
      <div className="flex min-h-[52px] flex-wrap gap-2 rounded-2xl border border-dashed border-line p-3">
        {order.length === 0 && (
          <span className="text-[14px] text-muted">Нажимайте на слова ниже по порядку</span>
        )}
        {order.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOrder((o) => o.filter((x) => x !== i))}
            className="rounded-full border border-ink bg-ink px-3 py-1.5 text-[15px] text-paper"
          >
            {tokens[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map(({ t, i }) => (
          <button
            key={i}
            type="button"
            onClick={() => setOrder((o) => [...o, i])}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-[15px] hover:border-ink"
          >
            {t}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={order.length !== tokens.length || submitting}
        onClick={() => onSubmit(order)}
        className="h-[52px] rounded-2xl bg-ink text-[16px] font-semibold text-paper disabled:opacity-40"
      >
        {submitting ? "Отправляем…" : "Ответить"}
      </button>
    </div>
  );
}
