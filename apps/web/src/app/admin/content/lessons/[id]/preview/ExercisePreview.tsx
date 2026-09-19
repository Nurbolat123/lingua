import type { Exercise } from "@/lib/types";

export function ExercisePreview({ exercise }: { exercise: Exercise }) {
  const c = exercise.content as Record<string, unknown>;

  switch (exercise.type) {
    case "MULTIPLE_CHOICE": {
      const options = (c.options as string[] | undefined) ?? [];
      return (
        <div className="flex flex-col gap-2">
          <p className="font-medium">{String(c.question ?? "")}</p>
          <div className="flex flex-col gap-2">
            {options.map((opt, i) => (
              <label key={i} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
                <input type="radio" name={exercise.id} disabled />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    case "FILL_BLANK": {
      const text = String(c.text ?? "");
      const parts = text.split("___");
      return (
        <p className="font-medium">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < parts.length - 1 && (
                <input
                  disabled
                  className="mx-1 inline-block w-24 rounded border border-line px-2 py-0.5 align-baseline"
                />
              )}
            </span>
          ))}
        </p>
      );
    }
    case "MATCHING": {
      const left = (c.left as string[] | undefined) ?? [];
      const right = (c.right as string[] | undefined) ?? [];
      return (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            {left.map((l, i) => (
              <div key={i} className="rounded-lg border border-line px-3 py-2">
                {l}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {right.map((r, i) => (
              <div key={i} className="rounded-lg border border-dashed border-line px-3 py-2 text-muted">
                {r}
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "ORDERING": {
      const tokens = (c.tokens as string[] | undefined) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {tokens.map((t, i) => (
            <span key={i} className="rounded-full border border-line bg-white px-3 py-1.5">
              {t}
            </span>
          ))}
        </div>
      );
    }
    case "FREE_RESPONSE":
      return (
        <div className="flex flex-col gap-2">
          <p className="font-medium">{String(c.question ?? "")}</p>
          <textarea disabled rows={3} placeholder="Ответ ученика…" className="rounded-lg border border-line px-3 py-2" />
        </div>
      );
    case "SPEAKING":
      return (
        <div className="flex items-center gap-3 rounded-xl bg-blue px-5 py-4 text-white">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-ink">🎤</span>
          <span className="font-medium">{String(c.prompt ?? "")}</span>
        </div>
      );
    default:
      return <pre className="text-[13px] text-muted">{JSON.stringify(c, null, 2)}</pre>;
  }
}
