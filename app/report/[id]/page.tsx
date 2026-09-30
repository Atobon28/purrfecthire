import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getRole } from "@/lib/scorecards";
import { evaluateCandidate } from "@/lib/scoring";
import type { Score } from "@/lib/types";
import { PrintButton } from "./print-button";
import styles from "./report.module.css";

export const dynamic = "force-dynamic";

function decisionLabel(decision: "Present" | "Hold" | "Reject") {
  if (decision === "Present") return "Presentar";
  if (decision === "Reject") return "No presentar";
  return "En revisión";
}

function statusFor(score: Score, hardGate?: boolean, minimumScore = 4) {
  if (score === null || score === undefined) return { label: "Por validar", className: styles.pending };
  if (hardGate && score < minimumScore) return { label: "No cumple", className: styles.negative };
  if (score >= 4) return { label: "Evidencia sólida", className: "" };
  return { label: "Señal mixta", className: styles.pending };
}

export default async function CandidateReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("assessments")
    .select("id,scores,logistics,evidence,recruiter_notes,completed,updated_at,candidates(id,name,role_slug,linkedin_url,current_role,current_company,location)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const candidate = Array.isArray((data as any).candidates) ? (data as any).candidates[0] : (data as any).candidates;
  const role = candidate?.role_slug ? getRole(candidate.role_slug) : null;
  if (!candidate || !role) notFound();

  const scores = ((data as any).scores ?? {}) as Record<string, Score>;
  const logistics = ((data as any).logistics ?? {}) as Record<string, string | boolean | null>;
  const evidence = ((data as any).evidence ?? {}) as Record<string, string>;
  const result = evaluateCandidate(role, scores, logistics);
  const criteria = [...role.technical, ...role.operating];

  const strongest = criteria
    .filter((criterion) => scores[criterion.id] !== null && scores[criterion.id] !== undefined)
    .sort((a, b) => Number(scores[b.id]) - Number(scores[a.id]) || b.weight - a.weight)
    .slice(0, 3);

  const fitCriteria = [...criteria]
    .sort((a, b) => Number(Boolean(b.hardGate)) - Number(Boolean(a.hardGate)) || b.weight - a.weight)
    .slice(0, 5);

  const pendingQuestions = criteria
    .filter((criterion) => scores[criterion.id] === null || scores[criterion.id] === undefined || Number(scores[criterion.id]) <= 3)
    .slice(0, 3)
    .map((criterion) => criterion.question);

  const strongLabels = strongest.filter((criterion) => Number(scores[criterion.id]) >= 4).map((criterion) => criterion.label);
  const summary = strongLabels.length
    ? `La evaluación dejó como señales más fuertes ${strongLabels.slice(0, 3).join(", ")}. El resultado actual es ${decisionLabel(result.decision).toLowerCase()}, con ${result.technicalScore?.toFixed(1) ?? "—"}/5 en técnico y ${result.operatingScore?.toFixed(1) ?? "—"}/5 en forma de trabajo.`
    : `La evaluación está ${result.decision === "Hold" ? "pendiente de validación suficiente" : "finalizada"}. Resultado actual: ${decisionLabel(result.decision).toLowerCase()}.`;

  const availability = typeof logistics.availability === "string" ? logistics.availability : null;
  const updatedAt = new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date((data as any).updated_at));

  return (
    <main className={styles.page}>
      <div className={styles.toolbar}><PrintButton /></div>
      <article className={styles.sheet}>
        <header className={styles.top}>
          <div className={styles.brand}><span className={styles.logo}>P</span>PurrfectHire</div>
          <span className={styles.eyebrow}>Presentación de candidato · confidencial</span>
        </header>

        <div className={styles.hero}>
          <div>
            <div className={styles.eyebrow}>Scorecard ejecutivo · {updatedAt}</div>
            <h1>{candidate.name}</h1>
            <div className={styles.sub}>{[candidate.current_role, candidate.current_company].filter(Boolean).join(" · ") || "Información actual por confirmar"} · Para <b>{role.role} / {role.client}</b></div>
            <div className={styles.sub} style={{ marginTop: 8 }}>{[candidate.location, availability].filter(Boolean).join(" · ") || "Ubicación / disponibilidad por confirmar"}{candidate.linkedin_url ? <> · <a href={candidate.linkedin_url.startsWith("http") ? candidate.linkedin_url : `https://${candidate.linkedin_url}`}>LinkedIn</a></> : null}</div>
          </div>
          <aside className={styles.decision}>
            <div className={styles.eyebrow}>Recomendación</div>
            <strong>{decisionLabel(result.decision)}</strong>
            <span>{result.reasons[0] ?? "Resultado basado en la evidencia registrada durante la evaluación."}</span>
          </aside>
        </div>

        <div className={styles.summary}><b>La lectura en 20 segundos</b>{summary}</div>

        <div className={styles.grid}>
          <section className={styles.section}>
            <h2>Por qué encaja</h2>
            {strongest.length ? strongest.map((criterion, index) => (
              <div className={styles.proof} key={criterion.id}>
                <span className={styles.num}>0{index + 1}</span>
                <div>
                  <strong>{criterion.label} · {scores[criterion.id]}/5</strong>
                  <p>{evidence[criterion.id]?.trim() || "No se escribió evidencia específica para este criterio; el score proviene de la evaluación realizada."}</p>
                </div>
              </div>
            )) : <p className={styles.small}>Todavía no hay criterios evaluados.</p>}
          </section>

          <section className={styles.section}>
            <h2>Ajuste a la vacante</h2>
            <div className={styles.fit}>
              {fitCriteria.map((criterion) => {
                const status = statusFor(scores[criterion.id], criterion.hardGate, criterion.minimumScore ?? 4);
                return <div className={styles.row} key={criterion.id}><span>{criterion.label}</span><span className={`${styles.status} ${status.className}`}>{status.label}</span></div>;
              })}
            </div>
            <div className={styles.questions}>
              <b style={{ fontSize: 12 }}>Preguntas para la siguiente entrevista</b>
              <ol>
                {(pendingQuestions.length ? pendingQuestions : ["Profundizar en el criterio con menor evidencia escrita antes de la siguiente decisión."]).map((question) => <li key={question}>{question}</li>)}
              </ol>
            </div>
          </section>
        </div>

        <section className={styles.evidence}>
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Evidencia de la evaluación</h2>
          <div className={styles.evidenceGrid}>
            <div className={styles.evidenceCard}><b>Qué resolvió / demostró</b><p>{evidence.__solved?.trim() || "No registrado."}</p></div>
            <div className={styles.evidenceCard}><b>Dónde necesitó pistas o apoyo</b><p>{evidence.__hints?.trim() || "No registrado."}</p></div>
            <div className={styles.evidenceCard}><b>Qué no pudimos validar</b><p>{evidence.__untested?.trim() || "No registrado."}</p></div>
          </div>
        </section>

        {(data as any).recruiter_notes ? <div className={styles.notes}><b>Notas del recruiter</b><br />{(data as any).recruiter_notes}</div> : null}

        <footer className={styles.footer}>
          <span>Preparado desde PurrfectHire · Uso interno del cliente</span>
          <span>Estados basados en evidencia disponible; “por validar” no implica descarte.</span>
        </footer>
      </article>
    </main>
  );
}
