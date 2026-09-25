"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, ExternalLink, LoaderCircle, Plus, RotateCcw } from "lucide-react";
import { evaluateCandidate } from "@/lib/scoring";
import { getRole, roles } from "@/lib/scorecards";
import type { Criterion, Score } from "@/lib/types";
import styles from "./evaluation-workspace.module.css";

type SavedEvaluation = {
  id: string;
  candidateId?: string;
  candidateName: string;
  roleSlug: string;
  linkedin?: string;
  currentRole?: string;
  currentCompany?: string;
  location?: string;
  scores: Record<string, Score>;
  logistics: Record<string, string | boolean | null>;
  notes: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function emptyScores(roleSlug: string) {
  const role = getRole(roleSlug);
  if (!role) return {};
  return Object.fromEntries([...role.technical, ...role.operating].map((criterion) => [criterion.id, null])) as Record<string, Score>;
}

function emptyLogistics(roleSlug: string) {
  const role = getRole(roleSlug);
  if (!role) return {};
  return Object.fromEntries(role.logistics.map((check) => [check.id, null])) as Record<string, string | boolean | null>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short" }).format(new Date(value));
}

function scoreTone(score: Score) {
  if (score === null) return "";
  if (score <= 2) return styles.scoreLow;
  if (score === 3) return styles.scoreMid;
  return styles.scoreHigh;
}

function CriterionCard({ criterion, value, onChange }: { criterion: Criterion; value: Score; onChange: (score: Score) => void }) {
  return (
    <article className={styles.criterionCard}>
      <div className={styles.criterionTopline}>
        <div>
          <div className={styles.criterionMeta}>
            <span>{criterion.weight}%</span>
            <span>{criterion.priority}</span>
            {criterion.hardGate ? <span className={styles.hardGate}>Indispensable · mín. {criterion.minimumScore ?? 4}</span> : <span>Preferencia</span>}
          </div>
          <h3>{criterion.label}</h3>
          <p className={styles.question}>{criterion.question}</p>
        </div>
      </div>

      <div className={styles.scoreBlock}>
        <div className={styles.scoreButtons}>
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => onChange(score as Score)}
              className={`${styles.scoreButton} ${value === score ? `${styles.selectedScore} ${scoreTone(score as Score)}` : ""}`}
              aria-label={`${criterion.label}: ${score} de 5`}
            >
              {score}
            </button>
          ))}
        </div>
        <button type="button" className={styles.notEvaluated} onClick={() => onChange(null)}>
          {value === null ? "Sin evaluar" : "Limpiar"}
        </button>
      </div>

      {(criterion.followUps?.length || criterion.strongSignals?.length || criterion.redFlags?.length) ? (
        <details className={styles.details}>
          <summary>Guía para profundizar</summary>
          <div className={styles.detailGrid}>
            {criterion.followUps?.length ? <div><strong>Follow-ups</strong>{criterion.followUps.map((item) => <p key={item}>{item}</p>)}</div> : null}
            {criterion.strongSignals?.length ? <div><strong>Señales fuertes</strong>{criterion.strongSignals.map((item) => <p key={item}>{item}</p>)}</div> : null}
            {criterion.redFlags?.length ? <div><strong>Red flags</strong>{criterion.redFlags.map((item) => <p key={item}>{item}</p>)}</div> : null}
          </div>
        </details>
      ) : null}
    </article>
  );
}

async function persistEvaluation(evaluation: SavedEvaluation) {
  const response = await fetch(`/api/evaluations/${evaluation.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scores: evaluation.scores,
      logistics: evaluation.logistics,
      notes: evaluation.notes,
      completed: evaluation.completed,
    }),
  });

  if (!response.ok) throw new Error("Save failed");
}

export function EvaluationWorkspace() {
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [creating, setCreating] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [roleSlug, setRoleSlug] = useState(roles[0]?.slug ?? "");
  const [linkedin, setLinkedin] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [currentRole, setCurrentRole] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [location, setLocation] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEvaluations() {
      try {
        const response = await fetch("/api/evaluations", { cache: "no-store" });
        if (!response.ok) throw new Error("Load failed");
        const data = (await response.json()) as { evaluations?: SavedEvaluation[] };
        if (!cancelled) {
          setEvaluations(data.evaluations ?? []);
          setLoadError(null);
          loadedOnce.current = true;
        }
      } catch {
        if (!cancelled) setLoadError("No pudimos conectar con la base de datos. Revisa la configuración de Supabase.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEvaluations();
    return () => { cancelled = true; };
  }, []);

  const active = evaluations.find((item) => item.id === activeId) ?? null;
  const activeRole = active ? getRole(active.roleSlug) : null;
  const activeResult = useMemo(() => {
    if (!active || !activeRole) return null;
    return evaluateCandidate(activeRole, active.scores, active.logistics);
  }, [active, activeRole]);

  useEffect(() => {
    if (!loadedOnce.current || !active) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await persistEvaluation(active);
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 650);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [active]);

  async function startNewEvaluation() {
    if (!candidateName.trim() || !roleSlug || creating) return;
    setCreating(true);
    setLoadError(null);

    const scores = emptyScores(roleSlug);
    const logistics = emptyLogistics(roleSlug);

    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candidateName.trim(),
          roleSlug,
          linkedin: linkedin.trim() || undefined,
          currentRole: currentRole.trim() || undefined,
          currentCompany: currentCompany.trim() || undefined,
          location: location.trim() || undefined,
          scores,
          logistics,
          notes: "",
          completed: false,
        }),
      });

      if (!response.ok) throw new Error("Create failed");
      const data = (await response.json()) as { evaluation: SavedEvaluation };
      const newEvaluation = data.evaluation;

      setEvaluations((current) => [newEvaluation, ...current.filter((item) => item.id !== newEvaluation.id)]);
      setActiveId(newEvaluation.id);
      setCandidateName("");
      setLinkedin("");
      setCurrentRole("");
      setCurrentCompany("");
      setLocation("");
      setShowExtra(false);
      setSaveState("saved");
    } catch {
      setLoadError("No se pudo crear la evaluación en Supabase. Revisa la conexión antes de continuar.");
    } finally {
      setCreating(false);
    }
  }

  function updateActive(updater: (current: SavedEvaluation) => SavedEvaluation) {
    if (!activeId) return;
    setEvaluations((current) => current.map((item) => item.id === activeId ? updater(item) : item));
  }

  function resetActive() {
    if (!active || !activeRole) return;
    updateActive((current) => ({
      ...current,
      scores: emptyScores(current.roleSlug),
      logistics: emptyLogistics(current.roleSlug),
      notes: "",
      completed: false,
      updatedAt: new Date().toISOString(),
    }));
  }

  async function finishEvaluation() {
    if (!active) return;
    const next = { ...active, completed: true, updatedAt: new Date().toISOString() };
    setEvaluations((current) => current.map((item) => item.id === active.id ? next : item));
    setSaveState("saving");
    try {
      await persistEvaluation(next);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const evaluatedCount = activeRole && active
    ? [...activeRole.technical, ...activeRole.operating].filter((criterion) => active.scores[criterion.id] !== null && active.scores[criterion.id] !== undefined).length
    : 0;
  const totalCriteria = activeRole ? activeRole.technical.length + activeRole.operating.length : 0;

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <button type="button" className={styles.brand} onClick={() => setActiveId(null)}>
          <span className={styles.brandMark}>P</span>
          <span>PurrfectHire</span>
        </button>

        <button type="button" className={styles.newButton} onClick={() => setActiveId(null)}>
          <Plus size={16} /> Nueva evaluación
        </button>

        <div className={styles.sidebarSection}>
          <div className={styles.sidebarHeading}>Evaluaciones</div>
          <div className={styles.historyList}>
            {loading ? <p className={styles.emptyHistory}>Cargando evaluaciones…</p> : null}
            {!loading && evaluations.length === 0 ? <p className={styles.emptyHistory}>Todavía no hay evaluaciones.</p> : null}
            {evaluations.map((evaluation) => {
              const role = getRole(evaluation.roleSlug);
              if (!role) return null;
              const result = evaluateCandidate(role, evaluation.scores, evaluation.logistics);
              return (
                <button
                  key={evaluation.id}
                  type="button"
                  onClick={() => setActiveId(evaluation.id)}
                  className={`${styles.historyItem} ${evaluation.id === activeId ? styles.historyItemActive : ""}`}
                >
                  <div className={styles.historyTitleRow}>
                    <strong>{evaluation.candidateName}</strong>
                    <ChevronRight size={14} />
                  </div>
                  <span>{role.role}</span>
                  <div className={styles.historyFooter}>
                    <span>{formatDate(evaluation.updatedAt)}</span>
                    <span className={`${styles.statusDot} ${styles[`status${evaluation.completed ? result.decision : "Draft"}`]}`}>
                      {evaluation.completed ? result.decision : "En curso"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        {!active || !activeRole || !activeResult ? (
          <div className={styles.startWrap}>
            <div className={styles.startCard}>
              <span className={styles.eyebrow}>Nueva evaluación</span>
              <h1>Empieza la entrevista.</h1>
              <p>Selecciona la vacante y crea la evaluación del candidato. Nada más.</p>

              {loadError ? <p style={{ margin: "14px 0", color: "#8a4141", fontSize: 12 }}>{loadError}</p> : null}

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Candidato *</span>
                  <input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Nombre completo" autoFocus />
                </label>
                <label className={styles.field}>
                  <span>Vacante *</span>
                  <select value={roleSlug} onChange={(event) => setRoleSlug(event.target.value)}>
                    {roles.map((role) => <option key={role.slug} value={role.slug}>{role.client} · {role.role}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>LinkedIn</span>
                  <input value={linkedin} onChange={(event) => setLinkedin(event.target.value)} placeholder="linkedin.com/in/..." />
                </label>
              </div>

              <button type="button" className={styles.extraToggle} onClick={() => setShowExtra((value) => !value)}>
                {showExtra ? "Ocultar datos opcionales" : "Agregar datos opcionales"}
              </button>

              {showExtra ? (
                <div className={styles.formGridSecondary}>
                  <label className={styles.field}><span>Cargo actual</span><input value={currentRole} onChange={(event) => setCurrentRole(event.target.value)} /></label>
                  <label className={styles.field}><span>Empresa actual</span><input value={currentCompany} onChange={(event) => setCurrentCompany(event.target.value)} /></label>
                  <label className={styles.field}><span>Ubicación</span><input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
                </div>
              ) : null}

              <button type="button" className={styles.primaryButton} onClick={startNewEvaluation} disabled={!candidateName.trim() || creating || Boolean(loadError)}>
                {creating ? <LoaderCircle size={16} className={styles.spin} /> : null}
                {creating ? "Creando…" : "Iniciar evaluación"} {!creating ? <ChevronRight size={16} /> : null}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.evaluationWrap}>
            <header className={styles.evaluationHeader}>
              <div>
                <div className={styles.eyebrow}>{activeRole.client} · {activeRole.role}</div>
                <h1>{active.candidateName}</h1>
                <p>{[active.currentRole, active.currentCompany, active.location].filter(Boolean).join(" · ") || "Evaluación de entrevista"}</p>
              </div>
              <div className={styles.headerActions}>
                <span style={{ fontSize: 11, color: saveState === "error" ? "#8a4141" : "#777771" }}>
                  {saveState === "saving" ? "Guardando…" : saveState === "error" ? "Error al guardar" : "Guardado en Supabase"}
                </span>
                {active.linkedin ? <a href={active.linkedin.startsWith("http") ? active.linkedin : `https://${active.linkedin}`} target="_blank" rel="noreferrer" className={styles.secondaryButton}>LinkedIn <ExternalLink size={14} /></a> : null}
                <button type="button" className={styles.iconButton} onClick={resetActive} title="Reiniciar evaluación"><RotateCcw size={15} /></button>
              </div>
            </header>

            <section className={styles.summaryCard}>
              <div className={styles.summaryIntro}>
                <span className={styles.eyebrow}>Resultado en vivo</span>
                <div className={`${styles.decisionPill} ${styles[`decision${activeResult.decision}`]}`}>{activeResult.decision}</div>
                <p>{evaluatedCount} de {totalCriteria} criterios evaluados</p>
              </div>
              <div className={styles.scoreSummary}>
                <div><span>Técnico</span><strong>{activeResult.technicalScore?.toFixed(2) ?? "—"}</strong></div>
                <div><span>Forma de trabajo</span><strong>{activeResult.operatingScore?.toFixed(2) ?? "—"}</strong></div>
                <div><span>Total</span><strong>{activeResult.overallScore?.toFixed(2) ?? "—"}</strong></div>
              </div>
              <div className={styles.summaryReason}>
                {activeResult.reasons.slice(0, 2).map((reason) => <p key={reason}>{reason}</p>)}
              </div>
            </section>

            <div className={styles.scaleLegend}>
              <strong>Escala</strong><span>1 Poor</span><span>2 Weak</span><span>3 Mixed</span><span>4 Strong</span><span>5 Exceptional</span>
            </div>

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>50% del resultado</span><h2>Técnico</h2></div><span>{activeResult.technicalCoverage}% evaluado</span></div>
              <div className={styles.criteriaStack}>
                {activeRole.technical.map((criterion) => (
                  <CriterionCard key={criterion.id} criterion={criterion} value={active.scores[criterion.id] ?? null} onChange={(score) => updateActive((current) => ({ ...current, scores: { ...current.scores, [criterion.id]: score }, completed: false, updatedAt: new Date().toISOString() }))} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>50% del resultado</span><h2>Forma de trabajo</h2></div><span>{activeResult.operatingCoverage}% evaluado</span></div>
              <p className={styles.sectionHelper}>Solo comportamientos observables relevantes al cargo: ownership, autonomía, comunicación y colaboración.</p>
              <div className={styles.criteriaStack}>
                {activeRole.operating.map((criterion) => (
                  <CriterionCard key={criterion.id} criterion={criterion} value={active.scores[criterion.id] ?? null} onChange={(score) => updateActive((current) => ({ ...current, scores: { ...current.scores, [criterion.id]: score }, completed: false, updatedAt: new Date().toISOString() }))} />
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Datos por confirmar</span><h2>Condiciones del candidato</h2></div></div>
              <div className={styles.logisticsGrid}>
                {activeRole.logistics.map((check) => (
                  <label className={styles.field} key={check.id}>
                    <span>{check.label}</span>
                    {check.type === "boolean" ? (
                      <div className={styles.choiceRow}>
                        {[{ label: "Sin confirmar", value: null }, { label: "Sí", value: true }, { label: "No", value: false }].map((option) => (
                          <button key={option.label} type="button" className={active.logistics[check.id] === option.value ? styles.choiceActive : ""} onClick={() => updateActive((current) => ({ ...current, logistics: { ...current.logistics, [check.id]: option.value }, completed: false, updatedAt: new Date().toISOString() }))}>{option.label}</button>
                        ))}
                      </div>
                    ) : (
                      <input value={typeof active.logistics[check.id] === "string" ? String(active.logistics[check.id]) : ""} placeholder={check.placeholder} onChange={(event) => updateActive((current) => ({ ...current, logistics: { ...current.logistics, [check.id]: event.target.value }, completed: false, updatedAt: new Date().toISOString() }))} />
                    )}
                  </label>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Opcional</span><h2>Notas</h2></div></div>
              <textarea className={styles.notes} rows={5} value={active.notes} placeholder="Contexto útil de la entrevista. No es obligatorio para puntuar." onChange={(event) => updateActive((current) => ({ ...current, notes: event.target.value, completed: false, updatedAt: new Date().toISOString() }))} />
            </section>

            <div className={styles.finishBar}>
              <div><strong>{active.completed ? "Evaluación finalizada" : "Evaluación en curso"}</strong><span>{saveState === "error" ? "No se pudo guardar el último cambio." : "Se guarda automáticamente en la base de datos."}</span></div>
              <button type="button" className={styles.primaryButton} onClick={finishEvaluation} disabled={saveState === "saving"}>
                {saveState === "saving" ? <LoaderCircle size={16} className={styles.spin} /> : <Check size={16} />} {active.completed ? "Guardar cambios" : "Finalizar evaluación"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
