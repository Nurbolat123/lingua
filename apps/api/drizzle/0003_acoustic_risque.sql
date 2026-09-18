CREATE TYPE "public"."lesson_progress_status" AS ENUM('IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "lesson_exercise_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"progress_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"answer" jsonb,
	"audio_key" text,
	"is_correct" boolean,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"status" "lesson_progress_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"current_block_order" integer DEFAULT 0 NOT NULL,
	"active_seconds" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "student_vocabulary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"repetition" integer DEFAULT 0 NOT NULL,
	"ease_factor" integer DEFAULT 250 NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"due_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_exercise_answers" ADD CONSTRAINT "lesson_exercise_answers_progress_id_lesson_progress_id_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."lesson_progress"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_exercise_answers" ADD CONSTRAINT "lesson_exercise_answers_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_vocabulary" ADD CONSTRAINT "student_vocabulary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_vocabulary" ADD CONSTRAINT "student_vocabulary_word_id_vocabulary_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."vocabulary_words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_exercise_answers_progress_exercise_uq" ON "lesson_exercise_answers" USING btree ("progress_id","exercise_id");--> statement-breakpoint
CREATE INDEX "lesson_exercise_answers_progress_idx" ON "lesson_exercise_answers" USING btree ("progress_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_progress_user_lesson_uq" ON "lesson_progress" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX "lesson_progress_user_idx" ON "lesson_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "student_vocabulary_user_word_uq" ON "student_vocabulary" USING btree ("user_id","word_id");--> statement-breakpoint
CREATE INDEX "student_vocabulary_due_idx" ON "student_vocabulary" USING btree ("user_id","due_at");--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;