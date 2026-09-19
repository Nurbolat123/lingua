import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, lte } from 'drizzle-orm';
import { sm2Next } from '../common/sm2';
import { DB, Database } from '../db/db.module';
import { studentVocabulary } from '../db/schema';
import { ReviewVocabularyDto } from './dto/learning.dto';

const DUE_LIMIT = 20;

@Injectable()
export class VocabularyReviewService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async due(userId: string) {
    const rows = await this.db.query.studentVocabulary.findMany({
      where: and(eq(studentVocabulary.userId, userId), lte(studentVocabulary.dueAt, new Date())),
      orderBy: asc(studentVocabulary.dueAt),
      limit: DUE_LIMIT,
      with: { word: true },
    });
    return rows.map((r) => ({
      id: r.id,
      word: r.word.word,
      translationRu: r.word.translationRu,
      transcription: r.word.transcription,
      example: (r.word.examples as string[])[0] ?? null,
    }));
  }

  async review(userId: string, id: string, dto: ReviewVocabularyDto) {
    const row = await this.db.query.studentVocabulary.findFirst({
      where: and(eq(studentVocabulary.id, id), eq(studentVocabulary.userId, userId)),
    });
    if (!row) throw new NotFoundException('Word not found');

    const next = sm2Next({ repetition: row.repetition, easeFactor: row.easeFactor / 100, intervalDays: row.intervalDays }, dto.quality);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + next.intervalDays);

    await this.db
      .update(studentVocabulary)
      .set({
        repetition: next.repetition,
        easeFactor: Math.round(next.easeFactor * 100),
        intervalDays: next.intervalDays,
        dueAt,
        lastReviewedAt: new Date(),
      })
      .where(eq(studentVocabulary.id, id));

    return { nextReviewInDays: next.intervalDays };
  }
}
