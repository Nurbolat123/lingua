"use client";

import { useState, useTransition } from "react";
import { downloadCsv } from "../downloadCsv";
import { importQuestions } from "./actions";
import type { ImportResult } from "@/lib/types";

const TEMPLATE =
  "skill,level,difficulty,type,question,options,correctAnswer,explanation\n" +
  'GRAMMAR,B1,2,MULTIPLE_CHOICE,"I ___ tired.",am;is;are,am,"Present Simple of ""to be""."\n' +
  "GRAMMAR,B1,2,FILL_BLANK,She ___ (work) here for 5 years.,,has worked;has been working,\n";

export function ImportQuestions() {
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleImport() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await importQuestions(csv));
      } catch {
        setError("Не удалось импортировать. Проверьте формат CSV.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[17px] font-semibold">Импорт из CSV</p>
        <button type="button" onClick={() => downloadCsv("questions-template.csv", TEMPLATE)} className="text-[13px] font-semibold text-blue">
          Скачать шаблон CSV
        </button>
      </div>
      <p className="mt-2 text-[13px] text-muted">
        Через CSV можно импортировать только MULTIPLE_CHOICE и FILL_BLANK — остальные типы (MATCHING, ORDERING,
        FREE_RESPONSE, SPEAKING) добавляются формой выше. options — варианты через «;», correctAnswer — текст
        правильного варианта (MULTIPLE_CHOICE) или допустимые ответы через «;» (FILL_BLANK).
      </p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder="Вставьте содержимое CSV-файла сюда"
        className="mt-3 w-full rounded-lg border border-line px-3 py-2 font-mono text-[13px]"
      />
      <button
        type="button"
        onClick={handleImport}
        disabled={pending || !csv.trim()}
        className="mt-3 h-[42px] rounded-full border border-ink px-6 text-[14px] font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-60"
      >
        {pending ? "Импортируем…" : "Импортировать"}
      </button>
      {error && <p className="mt-3 text-[14px] font-semibold text-error">{error}</p>}
      {result && (
        <div className="mt-3 text-[14px]">
          <p className="font-semibold">Импортировано: {result.imported}</p>
          {result.skipped.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-muted">
              {result.skipped.map((s, i) => (
                <li key={i}>Строка {s.row}: {s.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
