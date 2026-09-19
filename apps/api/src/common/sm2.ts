/**
 * SM-2 интервальное повторение. easeFactor хранится в БД ×100 (250 = 2.50),
 * чтобы не заводить numeric-тип в схеме — здесь работаем с ним как с обычным числом (2.5).
 */
export interface Sm2State {
  repetition: number;
  easeFactor: number; // 1.3–2.5+
  intervalDays: number;
}

/** quality: 0–5 (упрощённый интерфейс повторения даёт только «не помню» ≈1 и «помню» ≈4). */
export function sm2Next(state: Sm2State, quality: number): Sm2State {
  const q = Math.max(0, Math.min(5, quality));
  let { repetition, intervalDays } = state;
  let easeFactor = state.easeFactor;

  if (q < 3) {
    repetition = 0;
    intervalDays = 1;
  } else {
    if (repetition === 0) intervalDays = 1;
    else if (repetition === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
    repetition += 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  return { repetition, easeFactor, intervalDays };
}
