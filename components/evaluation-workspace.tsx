"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, ExternalLink, FileText, LoaderCircle, Plus, RefreshCw, RotateCcw, Save } from "lucide-react";
import { evaluateCandidate } from "@/lib/scoring";
import { getRole, roles } from "@/lib/scorecards";
import { finalDecisionReason, normalizePracticalOutcome, resolveFinalDecision } from "@/lib/optery-practical";
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
  evidence: Record<string, string>;
  practicalScores: Record<string, Score>;
  practicalEvidence: Record<string, string>;
  notes: string;
  screeningCompleted: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const OPTERY_PRACTICAL = [
  {
    id: "backend-system-design",
    label: "Backend / System Design",
    prompt: "Understand the unfamiliar system, choose what to change, implement the highest-value fix, and explain the trade-offs.",
  },
  {
    id: "data-integrity",
    label: "Databases / Data Integrity",
    prompt: "Identify and resolve the concurrency or data-integrity problem, explaining the transaction / locking / SQL behavior behind the fix.",
  },
  {
    id: "distributed-reliability",
    label: "Distributed Systems / Reliability",
    prompt: "Handle retries, duplicates, and external-service failures without breaking the intended business outcome.",
  },
  {
    id: "debugging-performance",
    label: "Production Debugging / Performance",
    prompt: "Investigate the slow endpoint, explain the SQL generated behind the ORM, reason about memory and query behavior at ~10M rows, and demonstrate that the fix works.",
  },
] as const;

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

function emptyPracticalScores(roleSlug: string) {
  if (roleSlug !== "optery-senior-backend") return {};
  return Object.fromEntries(OPTERY_PRACTICAL.map((criterion) => [criterion.id, null])) as Record<string, Score>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(value));
}

function scoreTone(score: Score) {
  if (score === null) return "";
  if (score <= 2) return styles.scoreLow;
  if (score === 3) return styles.scoreMid;
  return styles.scoreHigh;
}

function normalizeProjectStart(value?: string) {
  if (!value || value === "Sin evaluar") return "Not evaluated";
  if (value === "Pasa") return "Pass";
  if (value === "No pasa") return "Fail";
  return value;
}

function CriterionCard({ criterion, value, evidence, onChange, onEvidenceChange }: {
  criterion: Criterion;
  value: Score;
  evidence: string;
  onChange: (score: Score) => void;
  onEvidenceChange: (value: string) => void;
}) {
  return (
    <article className={styles.criterionCard}>
      <div className={styles.criterionTopline}>
        <div>
          <div className={styles.criterionMeta}>
            <span>{criterion.weight}%</span>
            <span>{criterion.priority}</span>
            {criterion.hardGate ? <span className={styles.hardGate}>Must-have · min. {criterion.minimumScore ?? 4}</span> : <span>Preference</span>}
          </div>
          <h3>{criterion.label}</h3>
          <p className={styles.question}>{criterion.question}</p>
        </div>
      </div>
      <div className={styles.scoreBlock}>
        <div className={styles.scoreButtons}>
          {[1, 2, 3, 4, 5].map((score) => (
            <button key={score} type="button" onClick={() => onChange(score as Score)} className={`${styles.scoreButton} ${value === score ? `${styles.selectedScore} ${scoreTone(score as Score)}` : ""}`}>
              {score}
            </button>
          ))}
        </div>
        <button type="button" className={styles.notEvaluated} onClick={() => onChange(null)}>{value === null ? "Not evaluated" : "Clear"}</button>
      </div>
      <label className={styles.field} style={{ marginTop: 14 }}>
        <span>Observed evidence · optional, used in the final report</span>
        <input value={evidence} onChange={(event) => onEvidenceChange(event.target.value)} placeholder="What they personally did, outcome, scale, or a concrete example" />
      </label>
      {(criterion.followUps?.length || criterion.strongSignals?.length || criterion.redFlags?.length) ? (
        <details className={styles.details}>
          <summary>Guide to go deeper</summary>
          <div className={styles.detailGrid}>
            {criterion.followUps?.length ? <div><strong>Follow-ups</strong>{criterion.followUps.map((item) => <p key={item}>{item}</p>)}</div> : null}
            {criterion.strongSignals?.length ? <div><strong>Strong signals</strong>{criterion.strongSignals.map((item) => <p key={item}>{item}</p>)}</div> : null}
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
      evidence: evaluation.evidence,
      practicalScores: evaluation.practicalScores,
      practicalEvidence: evaluation.practicalEvidence,
      notes: evaluation.notes,
      screeningCompleted: evaluation.screeningCompleted,
      completed: evaluation.completed,
    }),
  });
  if (!response.ok) throw new Error("Save failed");
}

export function EvaluationWorkspace() {
  const [evaluations, setEvaluations] = useState<SavedEvaluation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  async function refreshHistory(showSpinner = false) {
    if (showSpinner) setRefreshing(true);
    try {
      const response = await fetch(`/api/evaluations?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Load failed");
      const data = (await response.json()) as { evaluations?: SavedEvaluation[] };
      const normalized = (data.evaluations ?? []).map((item) => ({
        ...item,
        evidence: item.evidence ?? {},
        practicalScores: item.practicalScores ?? emptyPracticalScores(item.roleSlug),
        practicalEvidence: item.practicalEvidence ?? {},
        screeningCompleted: Boolean(item.screeningCompleted),
      }));

      setEvaluations((current) => {
        const merged = new Map(normalized.map((item) => [item.id, item]));
        current.forEach((local) => {
          if (!merged.has(local.id) || local.id === activeId) merged.set(local.id, local);
        });
        return [...merged.values()].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
      setLoadError(null);
      loadedOnce.current = true;
    } catch {
      setLoadError("We could not load the shared history from Supabase. The evaluation currently open on your screen will not be removed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshHistory();
    const onFocus = () => void refreshHistory();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = evaluations.find((item) => item.id === activeId) ?? null;
  const activeRole = active ? getRole(active.roleSlug) : null;
  const activeResult = useMemo(() => active && activeRole ? evaluateCandidate(activeRole, active.scores, active.logistics) : null, [active, activeRole]);
  const isOptery = active?.roleSlug === "optery-senior-backend";
  const projectStartValue = normalizeProjectStart(active?.practicalEvidence.__projectStart);
  const practicalOutcome = normalizePracticalOutcome(active?.practicalEvidence.__overallOutcome);
  const practicalDimensionsComplete = Boolean(
    active && OPTERY_PRACTICAL.every((item) => active.practicalScores[item.id] !== null && active.practicalScores[item.id] !== undefined),
  );
  const practicalComplete = Boolean(
    isOptery && active && practicalOutcome !== "Not evaluated" &&
    (practicalOutcome === "Fail" || (projectStartValue !== "Not evaluated" && practicalDimensionsComplete)),
  );
  const activeFinalDecision = active && activeResult
    ? resolveFinalDecision(active.roleSlug, activeResult.decision, active.completed, active.practicalEvidence)
    : null;

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
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [active]);

  async function startNewEvaluation() {
    if (!candidateName.trim() || !roleSlug || creating) return;
    setCreating(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candidateName.trim(), roleSlug,
          linkedin: linkedin.trim() || undefined,
          currentRole: currentRole.trim() || undefined,
          currentCompany: currentCompany.trim() || undefined,
          location: location.trim() || undefined,
          scores: emptyScores(roleSlug), logistics: emptyLogistics(roleSlug), evidence: {},
          practicalScores: emptyPracticalScores(roleSlug), practicalEvidence: {}, notes: "",
          screeningCompleted: false, completed: false,
        }),
      });
      if (!response.ok) throw new Error("Create failed");
      const data = (await response.json()) as { evaluation: SavedEvaluation };
      const next = {
        ...data.evaluation,
        evidence: data.evaluation.evidence ?? {},
        practicalScores: data.evaluation.practicalScores ?? emptyPracticalScores(roleSlug),
        practicalEvidence: data.evaluation.practicalEvidence ?? {},
        screeningCompleted: Boolean(data.evaluation.screeningCompleted),
      };
      setEvaluations((current) => [next, ...current.filter((item) => item.id !== next.id)]);
      setActiveId(next.id);
      setCandidateName("");
      setLinkedin("");
      setCurrentRole("");
      setCurrentCompany("");
      setLocation("");
      setShowExtra(false);
      setSaveState("saved");
    } catch {
      setLoadError("The evaluation could not be created in Supabase.");
    } finally {
      setCreating(false);
    }
  }

  function updateActive(updater: (current: SavedEvaluation) => SavedEvaluation) {
    if (!activeId) return;
    setEvaluations((current) => current.map((item) => item.id === activeId ? updater(item) : item));
  }

  function updateTheory(updater: (current: SavedEvaluation) => SavedEvaluation) {
    updateActive((current) => ({ ...updater(current), screeningCompleted: false, completed: false, updatedAt: new Date().toISOString() }));
  }

  function updatePractical(updater: (current: SavedEvaluation) => SavedEvaluation) {
    updateActive((current) => ({ ...updater(current), completed: false, updatedAt: new Date().toISOString() }));
  }

  function updateProjectStart(label: string) {
    const logisticValue = label === "Pass" ? true : label === "Fail" ? false : null;
    updatePractical((current) => ({
      ...current,
      logistics: { ...current.logistics, technicalEntryUnder3Minutes: logisticValue },
      practicalEvidence: { ...current.practicalEvidence, __projectStart: label },
    }));
  }

  function resetActive() {
    if (!active) return;
    updateActive((current) => ({
      ...current,
      scores: emptyScores(current.roleSlug),
      logistics: emptyLogistics(current.roleSlug),
      evidence: {},
      practicalScores: emptyPracticalScores(current.roleSlug),
      practicalEvidence: {},
      notes: "",
      screeningCompleted: false,
      completed: false,
      updatedAt: new Date().toISOString(),
    }));
  }

  async function saveScreening() {
    if (!active) return;
    const next = { ...active, screeningCompleted: true, completed: false, updatedAt: new Date().toISOString() };
    setEvaluations((current) => current.map((item) => item.id === active.id ? next : item));
    setSaveState("saving");
    try {
      await persistEvaluation(next);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function finishEvaluation() {
    if (!active) return;
    const next = { ...active, screeningCompleted: isOptery ? true : active.screeningCompleted, completed: true, updatedAt: new Date().toISOString() };
    setEvaluations((current) => current.map((item) => item.id === active.id ? next : item));
    setSaveState("saving");
    try {
      await persistEvaluation(next);
      setSaveState("saved");
      void refreshHistory();
    } catch {
      setSaveState("error");
    }
  }

  const evaluatedCount = activeRole && active
    ? [...activeRole.technical, ...activeRole.operating].filter((criterion) => active.scores[criterion.id] !== null && active.scores[criterion.id] !== undefined).length
    : 0;
  const totalCriteria = activeRole ? activeRole.technical.length + activeRole.operating.length : 0;
  const completedCount = evaluations.filter((item) => item.completed).length;
  const visibleLogistics = activeRole
    ? activeRole.logistics.filter((check) => !(isOptery && check.id === "technicalEntryUnder3Minutes"))
    : [];

  return (
    <div className={styles.workspace}>
      <aside className={styles.sidebar}>
        <button type="button" className={styles.brand} onClick={() => setActiveId(null)}><span className={styles.brandMark}>P</span><span>Purrfect Hire</span></button>
        <button type="button" className={styles.newButton} onClick={() => setActiveId(null)}><Plus size={16} /> New evaluation</button>

        <div className={styles.sidebarSection}>
          <div className={styles.sidebarHeading} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Evaluations · {completedCount} completed</span>
            <button type="button" onClick={() => void refreshHistory(true)} title="Refresh shared history" style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", color: "inherit" }}><RefreshCw size={12} className={refreshing ? styles.spin : undefined} /></button>
          </div>
          <div className={styles.historyList}>
            {loading ? <p className={styles.emptyHistory}>Loading shared history…</p> : null}
            {!loading && evaluations.length === 0 ? <p className={styles.emptyHistory}>No evaluations yet.</p> : null}
            {evaluations.map((evaluation) => {
              const role = getRole(evaluation.roleSlug);
              if (!role) return null;
              const theoryResult = evaluateCandidate(role, evaluation.scores, evaluation.logistics);
              const finalDecision = resolveFinalDecision(evaluation.roleSlug, theoryResult.decision, evaluation.completed, evaluation.practicalEvidence ?? {});
              const stageLabel = evaluation.completed ? finalDecision : evaluation.roleSlug === "optery-senior-backend" && evaluation.screeningCompleted ? "Theory saved" : "In progress";
              const stageClass = evaluation.completed ? styles[`status${finalDecision}`] : styles.statusDraft;
              return (
                <button key={evaluation.id} type="button" onClick={() => setActiveId(evaluation.id)} className={`${styles.historyItem} ${evaluation.id === activeId ? styles.historyItemActive : ""}`}>
                  <div className={styles.historyTitleRow}><strong>{evaluation.candidateName}</strong><ChevronRight size={14} /></div>
                  <span>{role.client} · {role.role}</span>
                  <div className={styles.historyFooter}><span>{formatDate(evaluation.updatedAt)}</span><span className={`${styles.statusDot} ${stageClass}`}>{stageLabel}</span></div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        {!active || !activeRole || !activeResult || !activeFinalDecision ? (
          <div className={styles.startWrap}>
            <div className={styles.startCard}>
              <span className={styles.eyebrow}>New evaluation</span>
              <h1>Start the interview.</h1>
              <p>Select the role and create the candidate evaluation. The sidebar history is shared through Supabase.</p>
              {loadError ? <p style={{ margin: "14px 0", color: "#8a4141", fontSize: 12 }}>{loadError}</p> : null}

              <div className={styles.formGrid}>
                <label className={styles.field}><span>Candidate *</span><input value={candidateName} onChange={(event) => setCandidateName(event.target.value)} placeholder="Full name" autoFocus /></label>
                <label className={styles.field}><span>Role *</span><select value={roleSlug} onChange={(event) => setRoleSlug(event.target.value)}>{roles.map((role) => <option key={role.slug} value={role.slug}>{role.client} · {role.role}</option>)}</select></label>
                <label className={styles.field}><span>LinkedIn</span><input value={linkedin} onChange={(event) => setLinkedin(event.target.value)} placeholder="linkedin.com/in/..." /></label>
              </div>

              <button type="button" className={styles.extraToggle} onClick={() => setShowExtra((value) => !value)}>{showExtra ? "Hide optional information" : "Add optional information"}</button>
              {showExtra ? <div className={styles.formGridSecondary}>
                <label className={styles.field}><span>Current role</span><input value={currentRole} onChange={(event) => setCurrentRole(event.target.value)} /></label>
                <label className={styles.field}><span>Current company</span><input value={currentCompany} onChange={(event) => setCurrentCompany(event.target.value)} /></label>
                <label className={styles.field}><span>Location</span><input value={location} onChange={(event) => setLocation(event.target.value)} /></label>
              </div> : null}

              <button type="button" className={styles.primaryButton} onClick={startNewEvaluation} disabled={!candidateName.trim() || creating || Boolean(loadError)}>
                {creating ? <LoaderCircle size={16} className={styles.spin} /> : null}
                {creating ? "Creating…" : "Start evaluation"} {!creating ? <ChevronRight size={16} /> : null}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.evaluationWrap}>
            <header className={styles.evaluationHeader}>
              <div>
                <div className={styles.eyebrow}>{activeRole.client} · {activeRole.role}</div>
                <h1>{active.candidateName}</h1>
                <p>{[active.currentRole, active.currentCompany, active.location].filter(Boolean).join(" · ") || "Interview evaluation"}</p>
              </div>
              <div className={styles.headerActions}>
                <span style={{ fontSize: 11, color: saveState === "error" ? "#8a4141" : "#777771" }}>{saveState === "saving" ? "Saving…" : saveState === "error" ? "Save error" : "Saved for everyone"}</span>
                {(active.completed || active.screeningCompleted) ? <a href={`/report/${active.id}`} target="_blank" rel="noreferrer" className={styles.secondaryButton}><FileText size={14} /> Report</a> : null}
                {active.linkedin ? <a href={active.linkedin.startsWith("http") ? active.linkedin : `https://${active.linkedin}`} target="_blank" rel="noreferrer" className={styles.secondaryButton}>LinkedIn <ExternalLink size={14} /></a> : null}
                <button type="button" className={styles.iconButton} onClick={resetActive} title="Reset evaluation"><RotateCcw size={15} /></button>
              </div>
            </header>

            <section className={styles.summaryCard}>
              <div className={styles.summaryIntro}><span className={styles.eyebrow}>{active.completed ? "Final result" : "Screening result"}</span><div className={`${styles.decisionPill} ${styles[`decision${active.completed ? activeFinalDecision : activeResult.decision}`]}`}>{active.completed ? activeFinalDecision : activeResult.decision}</div><p>{evaluatedCount} of {totalCriteria} criteria evaluated</p></div>
              <div className={styles.scoreSummary}><div><span>Technical</span><strong>{activeResult.technicalScore?.toFixed(2) ?? "—"}</strong></div><div><span>Ways of working</span><strong>{activeResult.operatingScore?.toFixed(2) ?? "—"}</strong></div><div><span>Overall theory</span><strong>{activeResult.overallScore?.toFixed(2) ?? "—"}</strong></div></div>
              <div className={styles.summaryReason}><p>{active.completed ? finalDecisionReason(active.roleSlug, activeResult.reasons[0], active.completed, active.practicalEvidence) : activeResult.reasons[0]}</p></div>
            </section>

            <div className={styles.scaleLegend}><strong>Scale</strong><span>1 Poor</span><span>2 Weak</span><span>3 Mixed</span><span>4 Strong</span><span>5 Exceptional</span></div>

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Theoretical screen · experience-based</span><h2>Technical</h2></div><span>{activeResult.technicalCoverage}% evaluated</span></div>
              <div className={styles.criteriaStack}>{activeRole.technical.map((criterion) => <CriterionCard key={criterion.id} criterion={criterion} value={active.scores[criterion.id] ?? null} evidence={active.evidence[criterion.id] ?? ""} onChange={(score) => updateTheory((current) => ({ ...current, scores: { ...current.scores, [criterion.id]: score } }))} onEvidenceChange={(value) => updateTheory((current) => ({ ...current, evidence: { ...current.evidence, [criterion.id]: value } }))} />)}</div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Theoretical screen · experience-based</span><h2>Ways of working</h2></div><span>{activeResult.operatingCoverage}% evaluated</span></div>
              <p className={styles.sectionHelper}>Only observable, job-relevant behaviors such as ownership, autonomy, communication, and collaboration.</p>
              <div className={styles.criteriaStack}>{activeRole.operating.map((criterion) => <CriterionCard key={criterion.id} criterion={criterion} value={active.scores[criterion.id] ?? null} evidence={active.evidence[criterion.id] ?? ""} onChange={(score) => updateTheory((current) => ({ ...current, scores: { ...current.scores, [criterion.id]: score } }))} onEvidenceChange={(value) => updateTheory((current) => ({ ...current, evidence: { ...current.evidence, [criterion.id]: value } }))} />)}</div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Information to confirm</span><h2>Candidate conditions</h2></div></div>
              <div className={styles.logisticsGrid}>{visibleLogistics.map((check) => <label className={styles.field} key={check.id}><span>{check.label}</span>{check.type === "boolean" ? <div className={styles.choiceRow}>{[{ label: "Not confirmed", value: null }, { label: "Yes", value: true }, { label: "No", value: false }].map((option) => <button key={option.label} type="button" className={active.logistics[check.id] === option.value ? styles.choiceActive : ""} onClick={() => updateTheory((current) => ({ ...current, logistics: { ...current.logistics, [check.id]: option.value } }))}>{option.label}</button>)}</div> : <input value={typeof active.logistics[check.id] === "string" ? String(active.logistics[check.id]) : ""} placeholder={check.placeholder} onChange={(event) => updateTheory((current) => ({ ...current, logistics: { ...current.logistics, [check.id]: event.target.value } }))} />}</label>)}</div>
            </section>

            {isOptery ? <>
              <div className={styles.finishBar} style={{ marginTop: 28 }}>
                <div><strong>{active.screeningCompleted ? "Theoretical screen saved" : "Finished the theoretical screen?"}</strong><span>This saves the experience-based interview screen and leaves the practical assessment completely blank so it can be completed later.</span></div>
                <button type="button" className={styles.primaryButton} onClick={saveScreening} disabled={saveState === "saving"}>{saveState === "saving" ? <LoaderCircle size={16} className={styles.spin} /> : <Save size={16} />} Save theoretical screen</button>
              </div>

              <section className={styles.section}>
                <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Technical assessment · 45–60 min · live and without AI</span><h2>Practical assessment</h2></div><span>{practicalComplete ? "Complete" : "Pending"}</span></div>
                <p className={styles.sectionHelper}>The practical is a required gate, not an average with the theoretical score. A Fail means Do not present even if the theoretical screen is 5/5. Dimension scores document evidence only.</p>

                <div className={styles.logisticsGrid} style={{ marginBottom: 10 }}>
                  <label className={styles.field}><span>Overall practical gate *</span><div className={styles.choiceRow}>{["Not evaluated", "Pass", "Fail"].map((label) => <button key={label} type="button" className={practicalOutcome === label ? styles.choiceActive : ""} onClick={() => updatePractical((current) => ({ ...current, practicalEvidence: { ...current.practicalEvidence, __overallOutcome: label } }))}>{label}</button>)}</div></label>
                  <label className={styles.field}><span>Unfamiliar project running in &lt;3 min</span><div className={styles.choiceRow}>{["Not evaluated", "Pass", "Fail"].map((label) => <button key={label} type="button" className={projectStartValue === label ? styles.choiceActive : ""} onClick={() => updateProjectStart(label)}>{label}</button>)}</div></label>
                </div>

                <div className={styles.criteriaStack}>{OPTERY_PRACTICAL.map((criterion) => <article className={styles.criterionCard} key={criterion.id}>
                  <div className={styles.criterionMeta}><span>Practical</span><span>Observe live evidence</span></div>
                  <h3>{criterion.label}</h3>
                  <p className={styles.question}>{criterion.prompt}</p>
                  <div className={styles.scoreBlock}><div className={styles.scoreButtons}>{[1,2,3,4,5].map((score) => <button key={score} type="button" onClick={() => updatePractical((current) => ({ ...current, practicalScores: { ...current.practicalScores, [criterion.id]: score as Score } }))} className={`${styles.scoreButton} ${active.practicalScores[criterion.id] === score ? `${styles.selectedScore} ${scoreTone(score as Score)}` : ""}`}>{score}</button>)}</div><button type="button" className={styles.notEvaluated} onClick={() => updatePractical((current) => ({ ...current, practicalScores: { ...current.practicalScores, [criterion.id]: null } }))}>Not evaluated</button></div>
                  <label className={styles.field} style={{ marginTop: 14 }}><span>Evidence / hints used</span><input value={active.practicalEvidence[criterion.id] ?? ""} onChange={(event) => updatePractical((current) => ({ ...current, practicalEvidence: { ...current.practicalEvidence, [criterion.id]: event.target.value } }))} placeholder="What they solved independently, where they needed hints, and what remained untested" /></label>
                </article>)}</div>
              </section>
            </> : null}

            <section className={styles.section}>
              <div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Final evidence</span><h2>What was demonstrated</h2></div></div>
              <div className={styles.logisticsGrid}>
                <label className={styles.field}><span>What they solved / demonstrated</span><input value={active.evidence.__solved ?? ""} onChange={(event) => updateActive((current) => ({ ...current, evidence: { ...current.evidence, __solved: event.target.value }, completed: false, updatedAt: new Date().toISOString() }))} /></label>
                <label className={styles.field}><span>Where they needed hints or support</span><input value={active.evidence.__hints ?? ""} onChange={(event) => updateActive((current) => ({ ...current, evidence: { ...current.evidence, __hints: event.target.value }, completed: false, updatedAt: new Date().toISOString() }))} /></label>
                <label className={styles.field}><span>What we could not validate</span><input value={active.evidence.__untested ?? ""} onChange={(event) => updateActive((current) => ({ ...current, evidence: { ...current.evidence, __untested: event.target.value }, completed: false, updatedAt: new Date().toISOString() }))} /></label>
              </div>
            </section>

            <section className={styles.section}><div className={styles.sectionHeader}><div><span className={styles.eyebrow}>Optional</span><h2>Notes</h2></div></div><textarea className={styles.notes} rows={5} value={active.notes} placeholder="Useful interview context. This will also appear in the report." onChange={(event) => updateActive((current) => ({ ...current, notes: event.target.value, completed: false, updatedAt: new Date().toISOString() }))} /></section>

            <div className={styles.finishBar}>
              <div><strong>{active.completed ? "Evaluation completed" : isOptery && active.screeningCompleted ? "Theory saved · practical pending" : "Evaluation in progress"}</strong><span>{saveState === "error" ? "The last change could not be saved." : "The record stays in Supabase and in the shared sidebar history."}</span></div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {(active.completed || active.screeningCompleted) ? <a href={`/report/${active.id}`} target="_blank" rel="noreferrer" className={styles.secondaryButton}><FileText size={14} /> View report</a> : null}
                {!isOptery || practicalComplete ? <button type="button" className={styles.primaryButton} onClick={finishEvaluation} disabled={saveState === "saving"}>{saveState === "saving" ? <LoaderCircle size={16} className={styles.spin} /> : <Check size={16} />} {active.completed ? "Save changes" : "Complete evaluation"}</button> : <span style={{ fontSize: 11, color: "#777771", alignSelf: "center" }}>The practical gate can stay pending. Use “Save theoretical screen”.</span>}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
