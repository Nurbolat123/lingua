CREATE TYPE "public"."audience" AS ENUM('KIDS', 'TEENS', 'ADULTS');--> statement-breakpoint
CREATE TYPE "public"."exercise_type" AS ENUM('MULTIPLE_CHOICE', 'FILL_BLANK', 'MATCHING', 'ORDERING', 'FREE_RESPONSE', 'SPEAKING');--> statement-breakpoint
CREATE TYPE "public"."lesson_block_type" AS ENUM('INTRO', 'VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING', 'EXERCISE', 'SPEAKING', 'MINI_TEST', 'HOMEWORK');--> statement-breakpoint
CREATE TYPE "public"."skill" AS ENUM('GRAMMAR', 'VOCABULARY', 'READING', 'LISTENING', 'SPEAKING');--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"level" text NOT NULL,
	"audience" "audience" NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_block_id" uuid NOT NULL,
	"type" "exercise_type" NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"type" "lesson_block_type" NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"title" text,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"estimated_minutes" integer DEFAULT 20 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_bank" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill" "skill" NOT NULL,
	"level" text NOT NULL,
	"difficulty" integer DEFAULT 1 NOT NULL,
	"type" "exercise_type" NOT NULL,
	"content" jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"translation_ru" text NOT NULL,
	"translation_kk" text,
	"definition" text,
	"level" text NOT NULL,
	"transcription" text,
	"audio_url" text,
	"examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"collocations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"related_words" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lesson_block_id_lesson_blocks_id_fk" FOREIGN KEY ("lesson_block_id") REFERENCES "public"."lesson_blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_blocks" ADD CONSTRAINT "lesson_blocks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "modules_course_idx" ON "modules" USING btree ("course_id","order");--> statement-breakpoint
CREATE INDEX "exercises_block_idx" ON "exercises" USING btree ("lesson_block_id","order");--> statement-breakpoint
CREATE INDEX "lesson_blocks_lesson_idx" ON "lesson_blocks" USING btree ("lesson_id","order");--> statement-breakpoint
CREATE INDEX "lessons_module_idx" ON "lessons" USING btree ("module_id","order");--> statement-breakpoint
CREATE INDEX "question_bank_skill_level_idx" ON "question_bank" USING btree ("skill","level");--> statement-breakpoint
CREATE INDEX "vocabulary_level_idx" ON "vocabulary_words" USING btree ("level");--> statement-breakpoint
CREATE UNIQUE INDEX "vocabulary_word_level_uq" ON "vocabulary_words" USING btree ("word","level");