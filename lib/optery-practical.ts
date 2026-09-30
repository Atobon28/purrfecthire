import type { EvaluationResult } from "./types";

export type PracticalOutcome = "Pass" | "Fail" | "Not evaluated";

export function normalizePracticalOutcome(value?: string): PracticalOutcome {
  if (value === "Pass" || value === "Pasa") return "Pass";
  if (value === "Fail" || value === "No pasa") return "Fail";
  return "Not evaluated";
}

export function resolveFinalDecision(
  roleSlug: string,
  theoryDecision: EvaluationResult["decision"],
  completed: boolean,
  practicalEvidence: Record<string, string>,
): EvaluationResult["decision"] {
  if (roleSlug !== "optery-senior-backend") return theoryDecision;

  const outcome = normalizePracticalOutcome(practicalEvidence.__overallOutcome);

  if (!completed || outcome === "Not evaluated") return completed ? "Hold" : theoryDecision;
  if (outcome === "Fail") return "Reject";
  return theoryDecision;
}

export function finalDecisionReason(
  roleSlug: string,
  theoryReason: string | undefined,
  completed: boolean,
  practicalEvidence: Record<string, string>,
) {
  if (roleSlug !== "optery-senior-backend") {
    return theoryReason ?? "Result based on the evidence recorded during the evaluation.";
  }

  const outcome = normalizePracticalOutcome(practicalEvidence.__overallOutcome);

  if (!completed || outcome === "Not evaluated") {
    return "The theoretical screen is saved, but the practical assessment gate is still pending.";
  }
  if (outcome === "Fail") {
    return "Do not present: the practical/live assessment is a required gate and was marked Fail, regardless of the theoretical score.";
  }
  return theoryReason ?? "The practical gate passed; the final recommendation follows the theoretical must-haves and candidate conditions.";
}
