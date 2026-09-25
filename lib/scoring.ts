import type { Criterion, EvaluationResult, RoleDefinition, Score } from "./types";

const MIN_SECTION_SCORE = 3.8;
const MIN_OVERALL_SCORE = 4.0;

function weightedScore(criteria: Criterion[], scores: Record<string, Score>) {
  const evaluated = criteria.filter((criterion) => scores[criterion.id] !== null && scores[criterion.id] !== undefined);
  const evaluatedWeight = evaluated.reduce((sum, criterion) => sum + criterion.weight, 0);

  if (!evaluated.length || evaluatedWeight === 0) {
    return { score: null, coverage: 0 };
  }

  const total = evaluated.reduce(
    (sum, criterion) => sum + Number(scores[criterion.id]) * criterion.weight,
    0,
  );

  return {
    score: Number((total / evaluatedWeight).toFixed(2)),
    coverage: Math.round((evaluatedWeight / 100) * 100),
  };
}

function isMissing(value: string | boolean | null | undefined) {
  return value === null || value === undefined || value === "";
}

export function evaluateCandidate(
  role: RoleDefinition,
  scores: Record<string, Score>,
  logistics: Record<string, string | boolean | null>,
): EvaluationResult {
  const allCriteria = [...role.technical, ...role.operating];
  const failedGateCriteria = allCriteria.filter(
    (criterion) =>
      criterion.hardGate &&
      scores[criterion.id] !== null &&
      scores[criterion.id] !== undefined &&
      Number(scores[criterion.id]) < Number(criterion.minimumScore ?? 4),
  );
  const unknownGateCriteria = allCriteria.filter(
    (criterion) => criterion.hardGate && (scores[criterion.id] === null || scores[criterion.id] === undefined),
  );

  const failedLogistics = role.logistics.filter(
    (check) => check.rejectIfFalse && logistics[check.id] === false,
  );
  const unknownLogistics = role.logistics.filter(
    (check) => check.requiredForPresent && isMissing(logistics[check.id]),
  );

  const technical = weightedScore(role.technical, scores);
  const operating = weightedScore(role.operating, scores);
  const overallScore =
    technical.score !== null && operating.score !== null
      ? Number(((technical.score + operating.score) / 2).toFixed(2))
      : null;

  const reasons: string[] = [];
  let decision: EvaluationResult["decision"] = "Hold";

  if (failedGateCriteria.length || failedLogistics.length) {
    decision = "Reject";
    failedGateCriteria.forEach((criterion) =>
      reasons.push(`${criterion.label} is below its required hiring bar.`),
    );
    failedLogistics.forEach((check) => reasons.push(`${check.label} does not meet the role requirement.`));
  } else if (unknownGateCriteria.length || unknownLogistics.length) {
    decision = "Hold";
    unknownGateCriteria.forEach((criterion) => reasons.push(`${criterion.label} still needs validation.`));
    unknownLogistics.forEach((check) => reasons.push(`${check.label} is still unknown.`));
  } else if (
    technical.score === null ||
    operating.score === null ||
    technical.score < MIN_SECTION_SCORE ||
    operating.score < MIN_SECTION_SCORE ||
    overallScore === null ||
    overallScore < MIN_OVERALL_SCORE
  ) {
    decision = "Hold";
    reasons.push(
      `No hard gate failed, but the calibrated score bar has not been reached (${MIN_SECTION_SCORE}+ in each area and ${MIN_OVERALL_SCORE}+ overall).`,
    );
  } else {
    decision = "Present";
    reasons.push("All hard gates and logistics checks pass, and the calibrated score bar is met.");
  }

  return {
    technicalScore: technical.score,
    operatingScore: operating.score,
    overallScore,
    technicalCoverage: technical.coverage,
    operatingCoverage: operating.coverage,
    decision,
    reasons,
    failedGates: [...failedGateCriteria.map((criterion) => criterion.id), ...failedLogistics.map((check) => check.id)],
    unknownGates: [...unknownGateCriteria.map((criterion) => criterion.id), ...unknownLogistics.map((check) => check.id)],
  };
}

export const scoringCalibration = {
  sectionMinimum: MIN_SECTION_SCORE,
  overallMinimum: MIN_OVERALL_SCORE,
};
