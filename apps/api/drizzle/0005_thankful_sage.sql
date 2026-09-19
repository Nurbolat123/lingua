CREATE TYPE "public"."homework_status" AS ENUM('ASSIGNED', 'SUBMITTED', 'REVIEWED', 'RETURNED');--> statement-breakpoint
ALTER TYPE "public"."skill_snapshot_source" ADD VALUE 'HOMEWORK';--> statement-breakpoint
CREATE TABLE "homework" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"assigned_by_curator_id" uuid,
	"lesson_id" uuid,
	"lesson_block_id" uuid,
	"title" text NOT NULL,
	"instructions" text,
	"requires_integrity_check" boolean DEFAULT false NOT NULL,
	"due_at" timestamp with time zone,
	"status" "homework_status" DEFAULT 'ASSIGNED' NOT NULL,
	"submission_text" text,
	"submission_audio_key" text,
	"submitted_at" timestamp with time zone,
	"integrity_signals" jsonb,
	"rubric" jsonb,
	"review_comment" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_curator_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_exercise_answers" ADD COLUMN "rubric" jsonb;--> statement-breakpoint
ALTER TABLE "lesson_exercise_answers" ADD COLUMN "review_comment" text;--> statement-breakpoint
ALTER TABLE "lesson_exercise_answers" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lesson_exercise_answers" ADD COLUMN "reviewed_by_curator_id" uuid;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_assigned_by_curator_id_users_id_fk" FOREIGN KEY ("assigned_by_curator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_lesson_block_id_lesson_blocks_id_fk" FOREIGN KEY ("lesson_block_id") REFERENCES "public"."lesson_blocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_reviewed_by_curator_id_users_id_fk" FOREIGN KEY ("reviewed_by_curator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "homework_student_status_idx" ON "homework" USING btree ("student_id","status");--> statement-breakpoint
ALTER TABLE "lesson_exercise_answers" ADD CONSTRAINT "lesson_exercise_answers_reviewed_by_curator_id_users_id_fk" FOREIGN KEY ("reviewed_by_curator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;