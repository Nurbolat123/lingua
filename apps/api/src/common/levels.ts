/** Уровень курса/слова/цели ученика — 5 ступеней. */
export const COURSE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

/** Уровень вопроса в банке — 9 ступеней для полуадаптивной лестницы placement-теста. */
export const QUESTION_LEVELS = ['A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1'] as const;
export type QuestionLevel = (typeof QUESTION_LEVELS)[number];
