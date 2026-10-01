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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
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
  const isOptery = candidate.role_slug === "optery-senior-backend";

  const practicalOutcome = normalizePracticalOutcome(practicalEvidence.__overallOutcome);
  const projectStart = practicalEvidence.__projectStart || "Not evaluated";

  const finalEvidence = evidence.__solved?.trim() || "";
  const summary = finalEvidence || "No final demonstrated-evidence note was recorded.";

  const practicalItems = isOptery
    ? OPTERY_PRACTICAL.map((criterion) => ({
        ...criterion,
        score: practicalScores[criterion.id],
        evidence: practicalEvidence[criterion.id]?.trim() || "",
      }))
    : [];

  const technicalScreeningItems = role.technical
    .map((criterion) => ({
      id: criterion.id,
      label: criterion.reportLabel ?? criterion.label,
      score: scores[criterion.id],
      evidence: evidence[criterion.id]?.trim() || "",
    }))
    .filter((item) => item.score !== null && item.score !== undefined || Boolean(item.evidence));

  const culturalItems = role.operating
    .map((criterion) => ({
      id: criterion.id,
      label: criterion.reportLabel ?? criterion.label,
      score: scores[criterion.id],
      evidence: evidence[criterion.id]?.trim() || "",
    }))
    .filter((item) => item.score !== null && item.score !== undefined || Boolean(item.evidence));

  const availability = formatAvailability(logistics.availability);
  const updatedAt = formatDate((data as any).updated_at);

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}><PrintButton hasPractical={isOptery} /></div>

      <article className={styles.sheet}>
        <div className={styles.pageSheet} data-pdf-section="practical">
          <header className={styles.top}>
            <div className={styles.brand}>
              <img className={styles.brandImage} src="/purrfecthire-logo.png" alt="" width={38} height={38} />
              <span>Purrfect Hire</span>
            </div>
            <span className={styles.eyebrow}>Candidate presentation · confidential</span>
          </header>

          <div className={styles.hero}>
            <div>
              <div className={styles.eyebrow}>Executive scorecard · ${updatedAt}</div>
              <h1 data-report-candidate>{candidate.name}</h1>
              <div className={styles.sub}>For <b>{role.role} / {role.client}</b></div>
              {(availability || candidate.linkedin_url) ? (
                <div className={`${styles.sub} ${styles.subMeta}`}>
                  {availability ? `Availability: ${availability}` : null}
                  {availability && candidate.linkedin_url ? " · " : null}
                  {candidate.linkedin_url ? (
                    <a href={candidate.linkedin_url.startsWith("http") ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}>LinkedIn</a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.summary}>
            <b>20-second read</b>
            <p>{summary}</p>
          </div>

          <section>
            <div className={styles.sectionHead}>
              <div className={styles.eyebrow}>Technical assessment · live and without AI</div>
              <h2>Practical assessment</h2>
            </div>

            <div className={styles.overview}>
              <div className={styles.card}>
                <b>What they solved / demonstrated</b>
                <p>{summary}</p>
              </div>

              <div className={`${styles.card} ${styles.result}`}>
                <b>Technical assessment result</b>
                <ul>
                  <li>Overall practical gate <span className={styles.pass}>{practicalOutcome}</span></li>
                  <li>Unfamiliar project running in &lt;3 min <span className={styles.pass}>{projectStart}</span></li>
                </ul>
              </div>
            </div>

            <div className={styles.breakdown}>
              <div className={styles.eyebrow}>Practical assessment breakdown · Observable evidence</div>
              <div className={`${styles.evidenceGrid} ${styles.four}`}>
                {practicalItems.map((item) => (
                  <div className={styles.card} key={item.id}>
                    <b>Practical · {item.label}{item.score !== null && item.score !== undefined ? ` · ${item.score}/5` : ""}</b>
                    <p>{item.evidence || "No dimension-specific evidence was recorded."}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className={styles.pageSheet} data-pdf-section="theory">
          <section>
            <div className={styles.sectionHead}>
              <div className={styles.eyebrow}>Theoretical screen · experience-based</div>
              <h2>Technical screening</h2>
            </div>

            <div className={styles.evidenceGrid}>
              {technicalScreeningItems.map((item) => (
                <div className={styles.card} key={item.id}>
                  <b>Theoretical · {item.label}{item.score !== null && item.score !== undefined ? ` · ${item.score}/5` : ""}</b>
                  <p>{item.evidence || "No technical-screening evidence was recorded."}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className={styles.sectionHead}>
              <h2 className={styles.solo}>Ways of working / cultural assessment</h2>
            </div>

            <div className={styles.evidenceGrid}>
              {culturalItems.map((item) => (
                <div className={styles.card} key={item.id}>
                  <b>{item.label}{item.score !== null && item.score !== undefined ? ` · ${item.score}/5` : ""}</b>
                  <p>{item.evidence || "No cultural evidence was recorded."}</p>
                </div>
              ))}
            </div>
          </section>

          {(data as any).recruiter_notes ? (
            <div className={styles.notes}><b>Recruiter notes</b><br />{(data as any).recruiter_notes}</div>
          ) : null}

          <footer>Prepared in Purrfect Hire · Client/internal use</footer>
        </div>
      </article>
    </main>
  );
}
