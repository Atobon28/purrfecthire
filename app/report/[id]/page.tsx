import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRole } from "@/lib/scorecards";
import type { Score } from "@/lib/types";
import { normalizePracticalOutcome } from "@/lib/optery-practical";
import { PrintButton } from "./print-button";
import styles from "./report.module.css";

export const dynamic = "force-dynamic";

const OPTERY_PRACTICAL = [
  { id: "backend-system-design", label: "Backend / System Design" },
  { id: "data-integrity", label: "Databases / Data Integrity" },
  { id: "distributed-reliability", label: "Distributed Systems / Reliability" },
  { id: "debugging-performance", label: "Production Debugging / Performance" },
] as const;

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
  const practicalOutcome = normalizePracticalOutcome(practicalEvidence.__overallOutcome);

  const theoreticalScored = [...role.technical, ...role.operating]
    .filter((criterion) => scores[criterion.id] !== null && scores[criterion.id] !== undefined);

  const theoryComplete = isOptery ? screeningCompleted || completed : completed;
  const theoryStatus = theoryComplete
    ? theoreticalScored.length
      ? "Completed"
      : "Saved · criteria unscored"
    : "In progress";

  const practicalScored = isOptery
    ? OPTERY_PRACTICAL.filter((criterion) => practicalScores[criterion.id] !== null && practicalScores[criterion.id] !== undefined)
    : [];
  const practicalStrong = practicalScored.filter((criterion) => Number(practicalScores[criterion.id]) >= 4);
  const practicalStatus = !isOptery ? "Not configured" : practicalOutcome === "Not evaluated" ? "Pending" : practicalOutcome;
  const projectStart = practicalEvidence.__projectStart || "Not evaluated";

  const assessmentSummary = isOptery
    ? [
        `Technical assessment: ${practicalStatus}.`,
        projectStart !== "Not evaluated" && projectStart !== "Sin evaluar" ? `Project start: ${projectStart}.` : null,
        practicalScored.length
          ? `${practicalScored.length}/${OPTERY_PRACTICAL.length} live dimensions scored; ${practicalStrong.length} at 4–5/5.`
          : null,
      ].filter(Boolean).join(" ")
    : "No separate live technical assessment is configured for this role.";

  const finalEvidence = evidence.__solved?.trim() || "";
  const finalEvidenceDetails = [
    { label: "What they solved / demonstrated", value: finalEvidence },
    { label: "Where they needed hints or support", value: evidence.__hints?.trim() },
    { label: "What we could not validate", value: evidence.__untested?.trim() },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  const technicalScreeningItems = role.technical
    .map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      score: scores[criterion.id],
      evidence: evidence[criterion.id]?.trim() || "",
    }))
    .filter((item) => item.score !== null && item.score !== undefined || Boolean(item.evidence));

  const culturalItems = role.operating
    .map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      score: scores[criterion.id],
      evidence: evidence[criterion.id]?.trim() || "",
    }))
    .filter((item) => item.score !== null && item.score !== undefined || Boolean(item.evidence));

  const availability = formatAvailability(logistics.availability);
  const currentInfo = [candidate.current_role, candidate.current_company].filter(Boolean).join(" · ");
  const candidateMeta = [
    candidate.location ? `Location: ${candidate.location}` : null,
    availability ? `Availability: ${availability}` : null,
  ].filter(Boolean) as string[];

  const updatedAt = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date((data as any).updated_at));

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}><PrintButton hasPractical={isOptery} /></div>
      <article className={styles.sheet}>
        <header className={styles.top}>
          <div className={styles.brand}><img className={styles.logo} src="/purrfecthire-logo.png" alt="" width={30} height={30} />Purrfect Hire</div>
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
        </div>

        <div className={styles.summary} data-pdf-section="practical"><b>20-second read</b>{assessmentSummary}</div>

        <section className={`${styles.assessment} ${styles.keepTogether}`} data-pdf-section="practical">
          <div className={styles.assessmentHeading}>
            <div className={styles.eyebrow}>Technical assessment · 45–60 min · live and without AI</div>
            <h2>Practical assessment</h2>
          </div>

          <div className={styles.assessmentGrid}>
            <div>
              <div className={styles.evidenceGrid}>
                {finalEvidenceDetails.length ? finalEvidenceDetails.map((item) => (
                  <div className={styles.evidenceCard} key={item.label}>
                    <b>{item.label}</b>
                    <p>{item.value}</p>
                  </div>
                )) : (
                  <div className={styles.evidenceCard}>
                    <b>Final evidence</b>
                    <p>No final demonstrated-evidence note was recorded.</p>
                  </div>
                )}
              </div>            </div>

            <div>
              <h3 className={styles.miniHeading}>Technical assessment result</h3>
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
            </div>
          </div>
        </section>

        <section className={styles.evidence} data-pdf-section="theory">
          <div className={styles.eyebrow}>Theoretical screen · experience-based</div>
          <h2 style={{ fontSize: 15, margin: "7px 0 14px" }}>Technical screening</h2>
          {technicalScreeningItems.length ? (
            <div className={styles.evidenceGrid}>
              {technicalScreeningItems.map((item) => (
                <div className={styles.evidenceCard} key={item.id}>
                  <b>{item.label}{item.score !== null && item.score !== undefined ? ` · ${item.score}/5` : ""}</b>
                  {item.evidence ? <p>{item.evidence}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.evidenceCard}>
              <b>Technical screening · {theoryStatus}</b>
              <p>No technical-screening scores or evidence were recorded in this evaluation.</p>
            </div>
          )}
        </section>

        <section className={styles.evidence} data-pdf-section="theory">
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Ways of working / cultural assessment</h2>
          {culturalItems.length ? (
            <div className={styles.evidenceGrid}>
              {culturalItems.map((item) => (
                <div className={styles.evidenceCard} key={item.id}>
                  <b>{item.label}{item.score !== null && item.score !== undefined ? ` · ${item.score}/5` : ""}</b>
                  {item.evidence ? <p>{item.evidence}</p> : null}
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
        <footer className={styles.footer}><span>Prepared in Purrfect Hire · Client/internal use</span></footer>
      </article>
    </main>
  );
}
