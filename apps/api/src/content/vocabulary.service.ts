import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ilike, or, SQL } from 'drizzle-orm';
import { parseCsv, splitMulti } from '../common/csv';
import { COURSE_LEVELS } from '../common/levels';
import { definedOnly, escapeLike, isUniqueViolation } from '../common/utils';
import { DB, Database } from '../db/db.module';
import { vocabularyWords } from '../db/schema';
import { CreateVocabularyDto, ImportVocabularyDto, ListVocabularyQueryDto, UpdateVocabularyDto } from './dto/vocabulary.dto';

@Injectable()
export class VocabularyService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(q: ListVocabularyQueryDto) {
    const conditions: (SQL | undefined)[] = [];
    if (q.level) conditions.push(eq(vocabularyWords.level, q.level));
    if (q.search?.trim()) {
      const s = `%${escapeLike(q.search.trim())}%`;
      conditions.push(or(ilike(vocabularyWords.word, s), ilike(vocabularyWords.translationRu, s)));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [items, total] = await Promise.all([
      this.db.query.vocabularyWords.findMany({
        where,
        orderBy: asc(vocabularyWords.word),
        limit: q.pageSize,
        offset: (q.page - 1) * q.pageSize,
      }),
      this.db.$count(vocabularyWords, where),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
  }

  async create(dto: CreateVocabularyDto) {
    try {
      const [row] = await this.db.insert(vocabularyWords).values(dto).returning();
      return row;
    } catch (e) {
      if (isUniqueViolation(e)) throw new NotFoundException('This word already exists at this level');
      throw e;
    }
  }

  async update(id: string, dto: UpdateVocabularyDto) {
    const [row] = await this.db.update(vocabularyWords).set(definedOnly(dto)).where(eq(vocabularyWords.id, id)).returning();
    if (!row) throw new NotFoundException('Word not found');
    return row;
  }

  async delete(id: string) {
    const rows = await this.db.delete(vocabularyWords).where(eq(vocabularyWords.id, id)).returning({ id: vocabularyWords.id });
    if (!rows.length) throw new NotFoundException('Word not found');
    return { ok: true };
  }

  /**
   * CSV-шаблон: word,translationRu,translationKk,definition,level,transcription,audioUrl,examples,collocations,relatedWords
   * Многозначные поля (examples/collocations/relatedWords) разделены внутри ячейки символом `;`.
   */
  async importCsv(dto: ImportVocabularyDto) {
    const rows = parseCsv(dto.csv);
    let imported = 0;
    const skipped: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.word || !r.translationRu || !r.level) {
        skipped.push({ row: i + 2, reason: 'word, translationRu и level обязательны' });
        continue;
      }
      if (!(COURSE_LEVELS as readonly string[]).includes(r.level)) {
        skipped.push({ row: i + 2, reason: `неизвестный уровень "${r.level}"` });
        continue;
      }
      try {
        await this.db.insert(vocabularyWords).values({
          word: r.word,
          translationRu: r.translationRu,
          translationKk: r.translationKk || null,
          definition: r.definition || null,
          level: r.level,
          transcription: r.transcription || null,
          audioUrl: r.audioUrl || null,
          examples: splitMulti(r.examples),
          collocations: splitMulti(r.collocations),
          relatedWords: splitMulti(r.relatedWords),
        });
        imported++;
      } catch (e) {
        skipped.push({ row: i + 2, reason: isUniqueViolation(e) ? 'уже существует на этом уровне' : 'ошибка записи' });
      }
    }

    return { imported, skipped };
  }
}
