import { DashboardShell } from "@/components/DashboardShell";
import { apiFetch } from "@/lib/api";
import type { MeResponse } from "@/lib/types";
import { getDueVocabulary } from "../learning-actions";
import { VocabularyReview } from "./VocabularyReview";

export default async function VocabularyPage() {
  const [user, words] = await Promise.all([apiFetch<MeResponse>("/users/me"), getDueVocabulary()]);

  return (
    <DashboardShell role="STUDENT" name={user.firstName} title="Повторение слов">
      <VocabularyReview initialWords={words} />
    </DashboardShell>
  );
}
