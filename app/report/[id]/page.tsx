import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRole } from "@/lib/scorecards";
import { evaluateCandidate } from "@/lib/scoring";
import type { Score } from "@/lib/types";
import { PrintButton } from "./print-button";
import styles from "./report.module.css";

export const dynamic = "force-dynamic";

const OPTERY_PRACTICAL = [
  { id: "backend-system-design", label: "Backend / System Design" },
  { id: "data-integrity", label: "Databases / Data Integrity" },
  { id: "distributed-reliability", label: "Distributed Systems / Reliability" },
  { id: "debugging-performance", label: "Production Debugging / Performance" },
] as const;

function decisionLabel(decision: "Present" | "Hold" | "Reject") {
  if (decision === "Present") return "Present";
  if (decision === "Reject") return "Do not present";
  return "Hold for review";
}

function practicalScoreAverage(scores: Record<string, Score>) {
  const values = OPTERY_PRACTICAL
    .map((criterion) => scores[criterion.id])
    .filter((value): value is Exclude<Score, null> => value !== null && value !== undefined);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default async function CandidateReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("assessments")
    .select("id,scores,logistics,evidence,practical_scores,practical_evidence,recruiter_notes,screening_completed,completed,updated_at,candidates(id,name,role_slug,linkedin_url,current_role,current_company,location)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const candidate = Array.isArray((data as any).candidates) ? (data as any).candidates[0] : (data as any).candidates;
  const role = candidate?.role_slug ? getRole(candidate.role_slug) : null;
  if (!candidate || !role) notFound();

  const scores = ((data as any).scores ?? {}) as Record<string, Score>;
  const logistics = ((data as any).logistics ?? {}) as Record<string, string | boolean | null>;
  const evidence = ((data as any).evidence ?? {}) as Record<string, string>;
  const practicalScores = ((data as any).practical_scores ?? {}) as Record<string, Score>;
  const practicalEvidence = ((data as any).practical_evidence ?? {}) as Record<string, string>;
  const screeningCompleted = Boolean((data as any).screening_completed);
  const completed = Boolean((data as any).completed);
  const isOptery = candidate.role_slug === "optery-senior-backend";
  const result = evaluateCandidate(role, scores, logistics);
  const criteria = [...role.technical, ...role.operating];

  const strongest = criteria
    .filter((criterion) => scores[criterion.id] !== null && scores[criterion.id] !== undefined)
    .sort((a, b) => Number(scores[b.id]) - Number(scores[a.id]) || b.weight - a.weight)
    .slice(0, 3);

  const strongLabels = strongest
    .filter((criterion) => Number(scores[criterion.id]) >= 4)
    .map((criterion) => criterion.label);

  const theoryComplete = isOptery ? screeningCompleted || completed : completed;
  const theoryStatus = theoryComplete ? "Completed" : "In progress";
  const practicalAverage = practicalScoreAverage(practicalScores);
  const practicalStatus = !isOptery ? "Not configured" : completed ? "Completed" : "Pending";
  const projectStart = practicalEvidence.__projectStart || "Not evaluated";

  const summary = strongLabels.length
    ? `The strongest signals from the interview were ${strongLabels.slice(0, 3).join(", ")}. The theoretical/interview screen currently reads ${decisionLabel(result.decision).toLowerCase()}, with ${result.technicalScore?.toFixed(1) ?? "—"}/5 in technical criteria and ${result.operatingScore?.toFixed(1) ?? "—"}/5 in ways of working.${isOptery && !completed ? " The practical assessment is still pending." : ""}`
    : `The theoretical/interview screen is ${theoryComplete ? "saved" : "still in progress"}.${isOptery && !completed ? " The practical assessment is still pending." : ""}`;

  const availability = typeof logistics.availability === "string" ? logistics.availability : null;
  const updatedAt = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date((data as any).updated_at));
  const recommendation = isOptery && screeningCompleted && !completed ? "Theory saved · practical pending" : decisionLabel(result.decision);
  const recommendationText = isOptery && screeningCompleted && !completed
    ? "The interview screen is saved. Final evaluation should wait until the practical assessment is completed."
    : result.reasons[0] ?? "Result based on the evidence recorded during the evaluation.";

  const theoreticalResult = `${decisionLabel(result.decision)} · Technical ${result.technicalScore?.toFixed(1) ?? "—"}/5 · Ways of working ${result.operatingScore?.toFixed(1) ?? "—"}/5`;
  const practicalResult = !isOptery
    ? "No practical assessment is currently configured for this role."
    : practicalAverage === null
      ? `Pending · Project start: ${projectStart}`
      : `${completed ? "Completed" : "In progress"} · ${practicalAverage.toFixed(1)}/5 average · Project start: ${projectStart}`;

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}><PrintButton /></div>
      <article className={styles.sheet}>
        <header className={styles.top}>
          <div className={styles.brand}><span className={styles.logo}>P</span>PurrfectHire</div>
          <span className={styles.eyebrow}>Candidate presentation · confidential</span>
        </header>

        <div className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Executive scorecard · {updatedAt}</div>
            <h1>{candidate.name}</h1>
            <div className={styles.sub}>{[candidate.current_role, candidate.current_company].filter(Boolean).join(" · ") || "Current information not confirmed"} · For <b>{role.role} / {role.client}</b></div>
            <div className={styles.sub} style={{ marginTop: 8 }}>{[candidate.location, availability].filter(Boolean).join(" · ") || "Location / availability not confirmed"}{candidate.linkedin_url ? <> · <a href={candidate.linkedin_url.startsWith("http") ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}>LinkedIn</a></> : null}</div>
          </div>
          <aside className={styles.decision}>
            <div className={styles.eyebrow}>Status / recommendation</div>
            <strong>{recommendation}</strong>
            <span>{recommendationText}</span>
          </aside>
        </div>

        <div className={styles.summary}><b>20-second read</b>{summary}</div>

        {isOptery ? <section className={styles.evidence}>
          <h2 style={{ fontSize: 15, marginBottom: 6 }}>Practical assessment breakdown</h2>
          <p className={styles.small} style={{ marginBottom: 14 }}>Detailed live-assessment results are shown first so the practical evidence is easy to scan at a glance.</p>
          <div className={styles.fit}>
            <div className={styles.row}><span>Unfamiliar project running in &lt;3 min</span><span className={`${styles.status} ${projectStart === "Not evaluated" || projectStart === "Sin evaluar" ? styles.pending : projectStart === "Fail" || projectStart === "No pasa" ? styles.negative : ""}`}>{projectStart}</span></div>
            {OPTERY_PRACTICAL.map((criterion) => {
              const score = practicalScores[criterion.id];
              return <div className={styles.row} key={criterion.id}><span>{criterion.label}</span><span className={`${styles.status} ${score === null || score === undefined ? styles.pending : Number(score) <= 2 ? styles.negative : Number(score) === 3 ? styles.pending : ""}`}>{score === null || score === undefined ? "Not evaluated" : `${score}/5`}</span></div>;
            })}
          </div>
        </section> : null}

        <div className={styles.grid}>
          <section className={styles.section}>
            <h2>Why this candidate fits</h2>
            {strongest.length ? strongest.map((criterion, index) => (
              <div className={styles.proof} key={criterion.id}>
                <span className={styles.num}>0{index + 1}</span>
                <div>
                  <strong>{criterion.label} · {scores[criterion.id]}/5</strong>
                  <p>{evidence[criterion.id]?.trim() || "No criterion-specific evidence was written; this score comes from the completed interview screen."}</p>
                </div>
              </div>
            )) : <p className={styles.small}>No criteria have been scored yet.</p>}
          </section>

          <section className={styles.section}>
            <h2>Theoretical vs practical evaluation</h2>
            <div className={styles.evidenceGrid}>
              <div className={styles.evidenceCard}>
                <b>Theoretical / interview screen · {theoryStatus}</b>
                <p><strong>What it measures:</strong> role-specific technical depth, ownership, judgment, communication, autonomy, motivation, and candidate conditions captured during the interview.</p>
                <p><strong>Result:</strong> {theoreticalResult}</p>
              </div>
              <div className={styles.evidenceCard}>
                <b>Practical / live assessment · {practicalStatus}</b>
                <p><strong>What it measures:</strong> {isOptery ? "ability to start an unfamiliar project quickly, backend/system design, data integrity, distributed-systems reliability, and production debugging/performance through live evidence." : "No separate practical stage is currently defined in this scorecard."}</p>
                <p><strong>Result:</strong> {practicalResult}</p>
              </div>
            </div>
          </section>
        </div>

        <section className={styles.evidence}>
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Evaluation evidence</h2>
          <div className={styles.evidenceGrid}>
            <div className={styles.evidenceCard}><b>What they solved / demonstrated</b><p>{evidence.__solved?.trim() || "Not recorded."}</p></div>
            <div className={styles.evidenceCard}><b>Where they needed hints or support</b><p>{evidence.__hints?.trim() || "Not recorded."}</p></div>
            <div className={styles.evidenceCard}><b>What we could not validate</b><p>{evidence.__untested?.trim() || (isOptery && !completed ? "Practical assessment pending." : "Not recorded.")}</p></div>
          </div>
          {isOptery && OPTERY_PRACTICAL.some((criterion) => practicalEvidence[criterion.id]?.trim()) ? <div className={styles.evidenceGrid} style={{ marginTop: 14 }}>{OPTERY_PRACTICAL.filter((criterion) => practicalEvidence[criterion.id]?.trim()).map((criterion) => <div className={styles.evidenceCard} key={criterion.id}><b>{criterion.label} · practical evidence</b><p>{practicalEvidence[criterion.id]}</p></div>)}</div> : null}
        </section>

        {(data as any).recruiter_notes ? <div className={styles.notes}><b>Recruiter notes</b><br />{(data as any).recruiter_notes}</div> : null}
        <footer className={styles.footer}><span>Prepared in PurrfectHire · Client/internal use</span><span>Statuses are based on available evidence; “not evaluated” does not imply rejection.</span></footer>
      </article>
    </main>
  );
}
