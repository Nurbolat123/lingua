CREATE TYPE "public"."attempt_status" AS ENUM('IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."skill_snapshot_source" AS ENUM('PLACEMENT', 'CONTROL_TEST', 'LESSON_MINI_TEST');--> statement-breakpoint
CREATE TABLE "placement_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"level" text NOT NULL,
	"answer" jsonb,
	"audio_key" text,
	"is_correct" boolean,
	"answered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"status" "attempt_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"include_speaking" boolean DEFAULT false NOT NULL,
	"current_skill" "skill" DEFAULT 'GRAMMAR' NOT NULL,
	"current_level_index" integer DEFAULT 4 NOT NULL,
	"results" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "skill_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"score" integer NOT NULL,
	"source" "skill_snapshot_source" NOT NULL,
	"attempt_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "grammar_score" integer;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "vocabulary_score" integer;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "reading_score" integer;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "listening_score" integer;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "speaking_score" integer;--> statement-breakpoint
ALTER TABLE "placement_answers" ADD CONSTRAINT "placement_answers_attempt_id_placement_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."placement_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_answers" ADD CONSTRAINT "placement_answers_question_id_question_bank_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question_bank"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement_attempts" ADD CONSTRAINT "placement_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_snapshots" ADD CONSTRAINT "skill_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_snapshots" ADD CONSTRAINT "skill_snapshots_attempt_id_placement_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."placement_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "placement_answers_attempt_idx" ON "placement_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "placement_attempts_user_idx" ON "placement_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "skill_snapshots_user_idx" ON "skill_snapshots" USING btree ("user_id","skill","created_at");