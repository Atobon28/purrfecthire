import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRole } from "@/lib/scorecards";
import { evaluateCandidate } from "@/lib/scoring";
import { normalizePracticalOutcome, resolveFinalDecision } from "@/lib/optery-practical";
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

function formatAvailability(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return `${trimmed} days`;
  return trimmed;
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
  const finalDecision = resolveFinalDecision(candidate.role_slug, result.decision, completed, practicalEvidence);
  const practicalOutcome = normalizePracticalOutcome(practicalEvidence.__overallOutcome);
  const criteria = [...role.technical, ...role.operating];

  const theoreticalScored = criteria
    .filter((criterion) => scores[criterion.id] !== null && scores[criterion.id] !== undefined)
    .sort((a, b) => Number(scores[b.id]) - Number(scores[a.id]) || b.weight - a.weight);
  const theoreticalStrong = theoreticalScored.filter((criterion) => Number(scores[criterion.id]) >= 4);

  const practicalScored = isOptery
    ? OPTERY_PRACTICAL.filter((criterion) => practicalScores[criterion.id] !== null && practicalScores[criterion.id] !== undefined)
    : [];
  const practicalStrong = practicalScored.filter((criterion) => Number(practicalScores[criterion.id]) >= 4);

  const practicalFitSignals = practicalStrong.map((criterion) => ({
    id: `practical-${criterion.id}`,
    source: "Practical",
    label: criterion.label,
    score: Number(practicalScores[criterion.id]),
    evidence: practicalEvidence[criterion.id]?.trim() || "",
    weight: 0,
  }));

  const theoreticalFitSignals = theoreticalStrong.map((criterion) => ({
    id: `theory-${criterion.id}`,
    source: "Theoretical",
    label: criterion.label,
    score: Number(scores[criterion.id]),
    evidence: evidence[criterion.id]?.trim() || "",
    weight: criterion.weight,
  }));

  const fitSignals = (isOptery
    ? [...practicalFitSignals, ...theoreticalFitSignals]
    : theoreticalFitSignals.sort((a, b) => Number(Boolean(b.evidence)) - Number(Boolean(a.evidence)) || b.score - a.score || b.weight - a.weight)
  ).slice(0, 4);

  const theoryComplete = isOptery ? screeningCompleted || completed : completed;
  const theoryStatus = theoryComplete
    ? theoreticalScored.length
      ? "Completed"
      : "Saved · criteria unscored"
    : "In progress";
  const practicalStatus = !isOptery ? "Not configured" : practicalOutcome === "Not evaluated" ? "Pending" : practicalOutcome;
  const projectStart = practicalEvidence.__projectStart || "Not evaluated";

  const evidenceSummary = evidence.__solved?.trim();
  const signalSummary = fitSignals.map((signal) => signal.evidence).filter(Boolean).slice(0, 2).join(" ");
  const summary = evidenceSummary || signalSummary || "Evidence is captured in the detailed assessment sections below.";

  const availability = formatAvailability(logistics.availability);
  const currentInfo = [candidate.current_role, candidate.current_company].filter(Boolean).join(" · ");
  const candidateMeta = [
    candidate.location ? `Location: ${candidate.location}` : null,
    availability ? `Availability: ${availability}` : null,
  ].filter(Boolean) as string[];

  const updatedAt = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date((data as any).updated_at));
  const recommendation = isOptery && screeningCompleted && !completed
    ? "Theory saved · practical pending"
    : decisionLabel(finalDecision);

  const recordedPracticalEvidence = isOptery
    ? OPTERY_PRACTICAL.filter((criterion) => practicalEvidence[criterion.id]?.trim())
    : [];

  const additionalEvidence = [
    { label: "Overall demonstrated evidence", value: evidence.__solved?.trim() },
    { label: "Where they needed hints or support", value: evidence.__hints?.trim() },
    { label: "What we could not validate", value: evidence.__untested?.trim() },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  const culturalItems = role.operating
    .map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      score: scores[criterion.id],
      evidence: evidence[criterion.id]?.trim() || "",
    }))
    .filter((item) => item.score !== null && item.score !== undefined || Boolean(item.evidence));

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}><PrintButton hasPractical={isOptery} /></div>
      <article className={styles.sheet}>
        <header className={styles.top}>
          <div className={styles.brand}><span className={styles.logo}>P</span>PurrfectHire</div>
          <span className={styles.eyebrow}>Candidate presentation · confidential</span>
        </header>

        <div className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Executive scorecard · {updatedAt}</div>
            <h1 data-report-candidate>{candidate.name}</h1>
            <div className={styles.sub}>{currentInfo ? <>{currentInfo} · </> : null}For <b>{role.role} / {role.client}</b></div>
            {(candidateMeta.length || candidate.linkedin_url) ? (
              <div className={styles.sub} style={{ marginTop: 8 }}>
                {candidateMeta.join(" · ")}
                {candidateMeta.length && candidate.linkedin_url ? " · " : null}
                {candidate.linkedin_url ? <a href={candidate.linkedin_url.startsWith("http") ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}>LinkedIn</a> : null}
              </div>
            ) : null}
          </div>
          <aside className={styles.decision}>
            <div className={styles.eyebrow}>Status / recommendation</div>
            <strong>{recommendation}</strong>
          </aside>
        </div>

        <div className={styles.summary} data-pdf-section="theory"><b>20-second read</b>{summary}</div>

        <div className={styles.grid}>
          <section className={styles.section} data-pdf-section="theory">
            <h2>Why this candidate fits</h2>
            {fitSignals.length ? fitSignals.map((signal, index) => (
              <div className={styles.proof} key={signal.id}>
                <span className={styles.num}>0{index + 1}</span>
                <div>
                  <strong>{signal.source} · {signal.label} · {signal.score}/5</strong>
                  <p>{signal.evidence || "This signal was scored 4–5/5, but no supporting evidence note was recorded."}</p>
                </div>
              </div>
            )) : <p className={styles.small}>No strong scored evidence has been captured yet.</p>}
          </section>

          <section className={styles.section} data-pdf-section="practical">
            <h2>Practical assessment breakdown</h2>
            {isOptery ? (
              <div className={styles.fit}>
                <div className={styles.row}><span>Overall practical gate</span><span className={`${styles.status} ${practicalOutcome === "Not evaluated" ? styles.pending : practicalOutcome === "Fail" ? styles.negative : ""}`}>{practicalOutcome}</span></div>
                <div className={styles.row}><span>Unfamiliar project running in &lt;3 min</span><span className={`${styles.status} ${projectStart === "Not evaluated" || projectStart === "Sin evaluar" ? styles.pending : projectStart === "Fail" || projectStart === "No pasa" ? styles.negative : ""}`}>{projectStart}</span></div>
                {OPTERY_PRACTICAL.map((criterion) => {
                  const score = practicalScores[criterion.id];
                  return <div className={styles.row} key={criterion.id}><span>{criterion.label}</span><span className={`${styles.status} ${score === null || score === undefined ? styles.pending : Number(score) <= 2 ? styles.negative : Number(score) === 3 ? styles.pending : ""}`}>{score === null || score === undefined ? "Not evaluated" : `${score}/5`}</span></div>;
                })}
              </div>
            ) : (
              <div className={styles.evidenceCard}>
                <b>Not configured</b>
                <p>No separate practical stage is currently defined in this scorecard.</p>
              </div>
            )}
          </section>
        </div>

        <section className={`${styles.evidence} ${styles.keepTogether}`} data-pdf-section="full-only">
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Theoretical vs practical evaluation</h2>
          <div className={styles.evidenceGrid}>
            <div className={styles.evidenceCard}>
              <b>Theoretical / interview screen · {theoryStatus}</b>
              <p><strong>What it measures:</strong> role-specific technical depth from prior experience, ownership, judgment, communication, autonomy, motivation, and candidate conditions captured during the interview.</p>
            </div>
            <div className={styles.evidenceCard}>
              <b>Practical / live assessment · {practicalStatus}</b>
              <p><strong>What it measures:</strong> {isOptery ? "live execution on an unfamiliar backend: project start, system design, data integrity, distributed-systems reliability, and production debugging/performance. This stage is a required gate, not an average with the theoretical screen." : "No separate practical stage is currently defined in this scorecard."}</p>
            </div>
          </div>
        </section>

        {isOptery && (recordedPracticalEvidence.length || additionalEvidence.length) ? <section className={styles.evidence} data-pdf-section="practical">
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Practical assessment evidence</h2>
          <div className={styles.evidenceGrid}>
            {recordedPracticalEvidence.map((criterion) => <div className={styles.evidenceCard} key={criterion.id}><b>{criterion.label}</b><p>{practicalEvidence[criterion.id]?.trim()}</p></div>)}
            {additionalEvidence.map((item) => <div className={styles.evidenceCard} key={item.label}><b>{item.label}</b><p>{item.value}</p></div>)}
          </div>
        </section> : null}

        <section className={styles.evidence} data-pdf-section="theory">
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Ways of working / cultural assessment</h2>
          {culturalItems.length ? (
            <div className={styles.evidenceGrid}>
              {culturalItems.map((item) => (
                <div className={styles.evidenceCard} key={item.id}>
                  <b>{item.label}{item.score !== null && item.score !== undefined ? ` · ${item.score}/5` : ""}</b>
                  {item.evidence ? <p>{item.evidence}</p> : <p>Scored in the interview; no evidence note was recorded.</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.evidenceCard}>
              <b>Not evaluated</b>
              <p>No ways-of-working / cultural evidence was recorded in this evaluation.</p>
            </div>
          )}
        </section>

        {(data as any).recruiter_notes ? <div className={styles.notes} data-pdf-section="full-only"><b>Recruiter notes</b><br />{(data as any).recruiter_notes}</div> : null}
        <footer className={styles.footer}><span>Prepared in PurrfectHire · Client/internal use</span><span>Statuses are based on available evidence; “not evaluated” does not imply rejection.</span></footer>
      </article>
    </main>
  );
}
