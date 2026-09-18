import { ExerciseType } from '../db/schema';

/** Убирает правильный ответ из содержимого упражнения/вопроса — для просмотра «глазами ученика». */
export function stripAnswer(type: ExerciseType, content: Record<string, unknown>): Record<string, unknown> {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const { correctIndex: _c, explanation: _e, ...rest } = content;
      return rest;
    }
    case 'FILL_BLANK': {
      const { answers: _a, ...rest } = content;
      return rest;
    }
    case 'MATCHING': {
      const pairs = (content.pairs as { left: string; right: string }[] | undefined) ?? [];
      return { left: pairs.map((p) => p.left), right: pairs.map((p) => p.right) };
    }
    case 'ORDERING': {
      const { correctOrder: _o, ...rest } = content;
      return rest;
    }
    case 'FREE_RESPONSE': {
      const { sampleAnswer: _s, rubric: _r, ...rest } = content;
      return rest;
    }
    case 'SPEAKING': {
      const { rubric: _r2, ...rest } = content;
      return rest;
    }
    default:
      return content;
  }
}

/**
 * Автопроверка ответа. Возвращает null, если тип не проверяется автоматически
 * (FREE_RESPONSE, SPEAKING — их оценивает куратор).
 */
export function gradeAnswer(type: ExerciseType, content: Record<string, unknown>, submitted: unknown): boolean | null {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correctIndex = content.correctIndex as number;
      return Number(submitted) === correctIndex;
    }
    case 'FILL_BLANK': {
      const answers = ((content.answers as string[] | undefined) ?? []).map((a) => a.trim().toLowerCase());
      const value = String(submitted ?? '').trim().toLowerCase();
      return answers.includes(value);
    }
    case 'MATCHING': {
      const pairs = (content.pairs as { left: string; right: string }[] | undefined) ?? [];
      const submittedPairs = (submitted as { left: string; right: string }[] | undefined) ?? [];
      if (submittedPairs.length !== pairs.length) return false;
      return pairs.every((p) => submittedPairs.some((s) => s.left === p.left && s.right === p.right));
    }
    case 'ORDERING': {
      const correctOrder = (content.correctOrder as number[] | undefined) ?? [];
      const submittedOrder = (submitted as number[] | undefined) ?? [];
      return JSON.stringify(correctOrder) === JSON.stringify(submittedOrder);
    }
    default:
      return null;
  }
}
