import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import { AuthUser } from '../common/auth.decorators';
import { gradeAnswer, stripAnswer } from '../common/exerciseContent';
import { levelMidpointScore, QUESTION_LEVELS, QuestionLevel } from '../common/levels';
import { DB, Database } from '../db/db.module';
import {
  consents, placementAnswers, placementAttempts, PlacementAttempt, questionBank, Skill, skillSnapshots, studentProfiles,
} from '../db/schema';
import { SubmitAnswerDto, SubmitSpeakingDto } from './dto/placement.dto';

const AUTO_SKILLS: Skill[] = ['GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING'];
const QUESTIONS_PER_SKILL = 6;
const SPEAKING_QUESTIONS = 2;
const START_LEVEL_INDEX = 4; // B1
const AUTO_GRADABLE_TYPES = ['MULTIPLE_CHOICE', 'FILL_BLANK', 'MATCHING', 'ORDERING'] as const;

interface SkillResult {
  level: QuestionLevel;
  score: number;
}
type ResultsShape = Partial<Record<Skill, SkillResult | { status: 'PENDING' }>> & {
  overall?: number;
  strongest?: Skill;
  weakest?: Skill;
};

@Injectable()
export class PlacementService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async startAttempt(actor: AuthUser | undefined) {
    let includeSpeaking = false;
    if (actor) {
      const consent = await this.db.query.consents.findFirst({
        where: and(eq(consents.subjectId, actor.id), eq(consents.type, 'VOICE_RECORDING'), isNull(consents.revokedAt)),
      });
      includeSpeaking = !!consent;
    }

    const [attempt] = await this.db
      .insert(placementAttempts)
      .values({ userId: actor?.id, includeSpeaking, currentSkill: 'GRAMMAR', currentLevelIndex: START_LEVEL_INDEX })
      .returning();

    return this.stateResponse(attempt);
  }

  async getState(id: string, actor: AuthUser | undefined) {
    const attempt = await this.loadOwnedAttempt(id, actor);
    return this.stateResponse(attempt);
  }

  async getNextQuestion(id: string, actor: AuthUser | undefined) {
    const attempt = await this.loadOwnedAttempt(id, actor);
    if (attempt.status === 'COMPLETED') return { completed: true, ...this.stateResponse(attempt) };

    const answeredIds = await this.answeredQuestionIds(id);

    if (attempt.currentSkill === 'SPEAKING') {
      const q = await this.pickQuestion({ skill: 'SPEAKING', excludeIds: answeredIds });
      if (!q) throw new BadRequestException('No speaking prompts available');
      return {
        completed: false,
        question: { id: q.id, type: q.type, content: stripAnswer(q.type, q.content as Record<string, unknown>) },
        skill: 'SPEAKING' as Skill,
        progress: await this.progressFor(id, attempt, 'SPEAKING'),
      };
    }

    const level = QUESTION_LEVELS[attempt.currentLevelIndex];
    const q = await this.pickQuestion({ skill: attempt.currentSkill, level, excludeIds: answeredIds });
    if (!q) throw new BadRequestException('No questions available at this level');

    return {
      completed: false,
      question: { id: q.id, type: q.type, content: stripAnswer(q.type, q.content as Record<string, unknown>) },
      skill: attempt.currentSkill,
      level,
      progress: await this.progressFor(id, attempt, attempt.currentSkill),
    };
  }

  async submitAnswer(id: string, actor: AuthUser | undefined, dto: SubmitAnswerDto) {
    const attempt = await this.loadOwnedAttempt(id, actor);
    if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt is not in progress');
    if (attempt.currentSkill === 'SPEAKING') throw new BadRequestException('Use the speaking endpoint for this skill');

    const question = await this.db.query.questionBank.findFirst({ where: eq(questionBank.id, dto.questionId) });
    if (!question || question.skill !== attempt.currentSkill) throw new BadRequestException('Question does not match current skill');

    const isCorrect = gradeAnswer(question.type, question.content as Record<string, unknown>, dto.answer) ?? false;

    await this.db.insert(placementAnswers).values({
      attemptId: id,
      questionId: question.id,
      skill: question.skill,
      level: question.level,
      answer: dto.answer as object,
      isCorrect,
    });

    const nextLevelIndex = Math.max(0, Math.min(QUESTION_LEVELS.length - 1, attempt.currentLevelIndex + (isCorrect ? 1 : -1)));

    const answeredCount = await this.countAnswered(id, attempt.currentSkill);
    if (answeredCount < QUESTIONS_PER_SKILL) {
      await this.db.update(placementAttempts).set({ currentLevelIndex: nextLevelIndex }).where(eq(placementAttempts.id, id));
      return { skillCompleted: false, attemptCompleted: false, progress: await this.progressFor(id, { ...attempt, currentLevelIndex: nextLevelIndex }, attempt.currentSkill) };
    }

    // Навык пройден — фиксируем результат и переходим дальше
    const finishedLevel = QUESTION_LEVELS[nextLevelIndex];
    const results: ResultsShape = { ...(attempt.results as ResultsShape | null) };
    results[attempt.currentSkill] = { level: finishedLevel, score: levelMidpointScore(finishedLevel) };

    const nextSkill = AUTO_SKILLS[AUTO_SKILLS.indexOf(attempt.currentSkill) + 1];
    if (nextSkill) {
      await this.db
        .update(placementAttempts)
        .set({ currentSkill: nextSkill, currentLevelIndex: START_LEVEL_INDEX, results })
        .where(eq(placementAttempts.id, id));
      return { skillCompleted: true, attemptCompleted: false, nextSkill, progress: await this.progressFor(id, { ...attempt, currentSkill: nextSkill, currentLevelIndex: START_LEVEL_INDEX }, nextSkill) };
    }

    if (attempt.includeSpeaking) {
      await this.db
        .update(placementAttempts)
        .set({ currentSkill: 'SPEAKING', results })
        .where(eq(placementAttempts.id, id));
      return { skillCompleted: true, attemptCompleted: false, nextSkill: 'SPEAKING', progress: await this.progressFor(id, { ...attempt, currentSkill: 'SPEAKING' }, 'SPEAKING') };
    }

    const finalResults = await this.finalizeAttempt({ ...attempt, results });
    return { skillCompleted: true, attemptCompleted: true, results: finalResults };
  }

  async submitSpeaking(id: string, actor: AuthUser | undefined, dto: SubmitSpeakingDto) {
    const attempt = await this.loadOwnedAttempt(id, actor);
    if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt is not in progress');
    if (attempt.currentSkill !== 'SPEAKING' || !attempt.includeSpeaking) throw new BadRequestException('Speaking is not available for this attempt');
    if (!actor) throw new ForbiddenException('Speaking requires an account');

    const consent = await this.db.query.consents.findFirst({
      where: and(eq(consents.subjectId, actor.id), eq(consents.type, 'VOICE_RECORDING'), isNull(consents.revokedAt)),
    });
    if (!consent) throw new ForbiddenException({ code: 'VOICE_RECORDING_CONSENT_REQUIRED', message: 'Voice recording consent is required' });

    const question = await this.db.query.questionBank.findFirst({ where: eq(questionBank.id, dto.questionId) });
    if (!question || question.skill !== 'SPEAKING') throw new BadRequestException('Question is not a speaking prompt');

    await this.db.insert(placementAnswers).values({
      attemptId: id,
      questionId: question.id,
      skill: 'SPEAKING',
      level: question.level,
      audioKey: dto.audioKey,
      isCorrect: null,
    });

    const answeredCount = await this.countAnswered(id, 'SPEAKING');
    if (answeredCount < SPEAKING_QUESTIONS) {
      return { skillCompleted: false, attemptCompleted: false, progress: await this.progressFor(id, attempt, 'SPEAKING') };
    }

    const results: ResultsShape = { ...(attempt.results as ResultsShape | null), SPEAKING: { status: 'PENDING' } };
    const finalResults = await this.finalizeAttempt({ ...attempt, results });
    return { skillCompleted: true, attemptCompleted: true, results: finalResults };
  }

  /** Анонимная попытка привязывается к аккаунту после регистрации/входа — тогда же сохраняется в профиль. */
  async claimAttempt(id: string, actor: AuthUser) {
    const attempt = await this.db.query.placementAttempts.findFirst({ where: eq(placementAttempts.id, id) });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId) {
      if (attempt.userId !== actor.id) throw new NotFoundException('Attempt not found');
      return this.stateResponse(attempt);
    }
    if (attempt.status !== 'COMPLETED') throw new BadRequestException('Only a completed attempt can be saved');

    await this.db.update(placementAttempts).set({ userId: actor.id }).where(eq(placementAttempts.id, id));
    await this.applyResultsToProfile(actor.id, attempt.results as ResultsShape, id);
    return this.stateResponse({ ...attempt, userId: actor.id });
  }

  // ── Внутреннее ───────────────────────────────────────────

  private async finalizeAttempt(attempt: PlacementAttempt): Promise<ResultsShape> {
    const results = attempt.results as ResultsShape;
    const graded = AUTO_SKILLS.map((s) => results[s]).filter((r): r is SkillResult => !!r && 'score' in r);
    const overall = graded.length ? Math.round(graded.reduce((sum, r) => sum + r.score, 0) / graded.length) : undefined;
    const scored = AUTO_SKILLS.filter((s) => results[s] && 'score' in (results[s] as SkillResult));
    const strongest = scored.length
      ? scored.reduce((a, b) => ((results[a] as SkillResult).score >= (results[b] as SkillResult).score ? a : b))
      : undefined;
    const weakest = scored.length
      ? scored.reduce((a, b) => ((results[a] as SkillResult).score <= (results[b] as SkillResult).score ? a : b))
      : undefined;

    const finalResults: ResultsShape = { ...results, overall, strongest, weakest };

    await this.db
      .update(placementAttempts)
      .set({ status: 'COMPLETED', completedAt: new Date(), currentLevelIndex: attempt.currentLevelIndex, results: finalResults })
      .where(eq(placementAttempts.id, attempt.id));

    if (attempt.userId) {
      await this.applyResultsToProfile(attempt.userId, finalResults, attempt.id);
    }

    return finalResults;
  }

  private async applyResultsToProfile(userId: string, results: ResultsShape, attemptId: string) {
    const update: Record<string, number> = {};
    const skillColumn: Record<Skill, string> = {
      GRAMMAR: 'grammarScore', VOCABULARY: 'vocabularyScore', READING: 'readingScore', LISTENING: 'listeningScore', SPEAKING: 'speakingScore',
    };
    for (const skill of AUTO_SKILLS) {
      const r = results[skill];
      if (r && 'score' in r) {
        update[skillColumn[skill]] = r.score;
        await this.db.insert(skillSnapshots).values({ userId, skill, score: r.score, source: 'PLACEMENT', attemptId });
      }
    }
    if (Object.keys(update).length) {
      await this.db.update(studentProfiles).set(update).where(eq(studentProfiles.userId, userId));
    }
  }

  private async loadOwnedAttempt(id: string, actor: AuthUser | undefined) {
    const attempt = await this.db.query.placementAttempts.findFirst({ where: eq(placementAttempts.id, id) });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId && attempt.userId !== actor?.id) throw new NotFoundException('Attempt not found');
    return attempt;
  }

  private async answeredQuestionIds(attemptId: string): Promise<string[]> {
    const rows = await this.db.query.placementAnswers.findMany({
      where: eq(placementAnswers.attemptId, attemptId),
      columns: { questionId: true },
    });
    return rows.map((r) => r.questionId);
  }

  private async countAnswered(attemptId: string, skill: Skill): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(placementAnswers)
      .where(and(eq(placementAnswers.attemptId, attemptId), eq(placementAnswers.skill, skill)));
    return row?.n ?? 0;
  }

  private async progressFor(attemptId: string, attempt: PlacementAttempt, skill: Skill) {
    const answered = await this.countAnswered(attemptId, skill);
    const total = skill === 'SPEAKING' ? SPEAKING_QUESTIONS : QUESTIONS_PER_SKILL;
    return { skill, answered, total, skillIndex: AUTO_SKILLS.indexOf(skill), totalSkills: AUTO_SKILLS.length + (attempt.includeSpeaking ? 1 : 0) };
  }

  /** Ищет вопрос на нужном уровне; если банк пуст на этом уровне — берёт ближайший доступный. */
  private async pickQuestion(opts: { skill: Skill; level?: QuestionLevel; excludeIds: string[] }) {
    const typeFilter = opts.skill === 'SPEAKING' ? eq(questionBank.type, 'SPEAKING') : inArray(questionBank.type, [...AUTO_GRADABLE_TYPES]);

    if (!opts.level) {
      return this.db.query.questionBank.findFirst({
        where: and(eq(questionBank.skill, opts.skill), typeFilter, opts.excludeIds.length ? notInArray(questionBank.id, opts.excludeIds) : undefined),
        orderBy: sql`random()`,
      });
    }

    const startIdx = QUESTION_LEVELS.indexOf(opts.level);
    for (let offset = 0; offset < QUESTION_LEVELS.length; offset++) {
      for (const idx of offset === 0 ? [startIdx] : [startIdx - offset, startIdx + offset]) {
        if (idx < 0 || idx >= QUESTION_LEVELS.length) continue;
        const found = await this.db.query.questionBank.findFirst({
          where: and(
            eq(questionBank.skill, opts.skill),
            eq(questionBank.level, QUESTION_LEVELS[idx]),
            typeFilter,
            opts.excludeIds.length ? notInArray(questionBank.id, opts.excludeIds) : undefined,
          ),
          orderBy: sql`random()`,
        });
        if (found) return found;
      }
    }
    return undefined;
  }

  private stateResponse(attempt: PlacementAttempt) {
    return {
      id: attempt.id,
      status: attempt.status,
      includeSpeaking: attempt.includeSpeaking,
      currentSkill: attempt.status === 'COMPLETED' ? null : attempt.currentSkill,
      results: attempt.results,
    };
  }
}
