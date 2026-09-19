import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api";
import { ACCESS_TOKEN_COOKIE, decodeAccessToken } from "@/lib/session";
import { claimPlacementAttempt, getPlacementState } from "../actions";
import { ResultsView } from "./ResultsView";
import { TestRunner } from "./TestRunner";

export default async function TestAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let state;
  try {
    state = await getPlacementState(id);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  if (state.status !== "COMPLETED") {
    return <TestRunner attemptId={id} initialState={state} />;
  }

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const isLoggedIn = !!(token && decodeAccessToken(token));
  if (isLoggedIn) {
    // Если попытка ещё анонимная — привяжется к аккаунту; если уже сохранена, ничего не изменится.
    await claimPlacementAttempt(id);
  }

  return (
    <ResultsView
      attemptId={id}
      results={state.results}
      includeSpeaking={state.includeSpeaking}
      saved={isLoggedIn}
    />
  );
}
