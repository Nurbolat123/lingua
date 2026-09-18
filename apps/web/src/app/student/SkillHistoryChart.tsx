import type { Skill, SkillSnapshot, SkillSnapshotSource } from "@/lib/types";

const SKILL_LABELS: Record<Skill, string> = {
  GRAMMAR: "Грамматика",
  VOCABULARY: "Лексика",
  READING: "Чтение",
  LISTENING: "Аудирование",
  SPEAKING: "Говорение",
};

const SKILL_ORDER: Skill[] = ["GRAMMAR", "VOCABULARY", "READING", "LISTENING", "SPEAKING"];

const SKILL_COLORS: Record<Skill, string> = {
  GRAMMAR: "#2B3FD6",
  VOCABULARY: "#16181D",
  READING: "#B45309",
  LISTENING: "#0E7490",
  SPEAKING: "#7C3AED",
};

const SOURCE_LABELS: Record<SkillSnapshotSource, string> = {
  PLACEMENT: "вступительный тест",
  CONTROL_TEST: "контрольный тест",
  LESSON_MINI_TEST: "мини-тест урока",
};

const WIDTH = 600;
const HEIGHT = 220;
const PAD_LEFT = 30;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

export function SkillHistoryChart({ snapshots }: { snapshots: SkillSnapshot[] }) {
  if (snapshots.length < 2) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6">
        <p className="text-[15px] font-semibold">Динамика по навыкам</p>
        <p className="mt-2 text-[14px] text-muted">
          График появится, когда наберётся больше одной точки — например, после теста и первого мини-теста в уроке.
        </p>
      </div>
    );
  }

  const times = snapshots.map((s) => new Date(s.createdAt).getTime());
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const spanT = maxT - minT || 1;

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const x = (t: number) => PAD_LEFT + ((t - minT) / spanT) * innerW;
  const y = (score: number) => PAD_TOP + innerH - (Math.max(0, Math.min(100, score)) / 100) * innerH;

  const bySkill = SKILL_ORDER.map((skill) => ({
    skill,
    points: snapshots
      .filter((s) => s.skill === skill)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
  })).filter((s) => s.points.length > 0);

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });

  return (
    <div className="rounded-2xl border border-line bg-card p-6">
      <p className="text-[15px] font-semibold">Динамика по навыкам</p>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-4 w-full" role="img" aria-label="График динамики баллов по навыкам">
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={2} y={y(v) + 4} fontSize={10} fill="var(--muted)">
              {v}
            </text>
          </g>
        ))}

        {bySkill.map(({ skill, points }) => {
          const color = SKILL_COLORS[skill];
          const path = points.map((p) => `${x(new Date(p.createdAt).getTime())},${y(p.score)}`).join(" ");
          return (
            <g key={skill}>
              {points.length > 1 && (
                <polyline points={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              )}
              {points.map((p, i) => (
                <circle key={i} cx={x(new Date(p.createdAt).getTime())} cy={y(p.score)} r={3.5} fill={color}>
                  <title>
                    {SKILL_LABELS[skill]}: {p.score} · {SOURCE_LABELS[p.source]} · {dateFmt(p.createdAt)}
                  </title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {bySkill.map(({ skill, points }) => (
          <div key={skill} className="flex items-center gap-1.5 text-[13px]">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SKILL_COLORS[skill] }} />
            <span>{SKILL_LABELS[skill]}</span>
            <span className="text-muted">{points[points.length - 1].score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
