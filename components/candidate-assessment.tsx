"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, ExternalLink, RotateCcw } from "lucide-react";
import { evaluateCandidate } from "@/lib/scoring";
import type { Candidate, Criterion, RoleDefinition, Score } from "@/lib/types";

function decisionClass(decision: string) {
  return decision.toLowerCase();
}

function scoreTone(score: Score) {
  if (score === null) return "";
  if (score <= 2) return "score-low";
  if (score === 3) return "score-mid";
  return "score-high";
}

function createInitialScores(role: RoleDefinition, candidate: Candidate) {
  return Object.fromEntries(
    [...role.technical, ...role.operating].map((criterion) => [
      criterion.id,
      candidate.scores[criterion.id] ?? null,
    ]),
  ) as Record<string, Score>;
}

function createInitialLogistics(role: RoleDefinition, candidate: Candidate) {
  return Object.fromEntries(
    role.logistics.map((check) => [check.id, candidate.logistics[check.id] ?? null]),
  ) as Record<string, string | boolean | null>;
}

function CriterionRow({
  criterion,
  value,
  onChange,
}: {
  criterion: Criterion;
  value: Score;
  onChange: (value: Score) => void;
}) {
  return (
    <div className="criterion-row">
      <div className="criterion-copy">
        <div className="criterion-title-line">
          <h3>{criterion.label}</h3>
          <span className={`priority priority-${criterion.priority}`}>{criterion.priority}</span>
          <span className="weight">{criterion.weight}%</span>
          {criterion.hardGate && <span className="hard-gate">Hard gate · min {criterion.minimumScore ?? 4}</span>}
        </div>
        <details className="question-details">
          <summary>Interview prompt</summary>
          <p className="primary-question">{criterion.question}</p>
          {criterion.followUps?.length ? (
            <div className="prompt-block">
              <span>Follow-ups</span>
              <ul>
                {criterion.followUps.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {criterion.strongSignals?.length ? (
            <div className="prompt-block">
              <span>Strong signals</span>
              <ul>
                {criterion.strongSignals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {criterion.redFlags?.length ? (
            <div className="prompt-block">
              <span>Red flags</span>
              <ul>
                {criterion.redFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </details>
      </div>
      <div className="score-control" aria-label={`Score ${criterion.label}`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            type="button"
            key={score}
            className={`score-button ${value === score ? `selected ${scoreTone(score as Score)}` : ""}`}
            onClick={() => onChange(score as Score)}
          >
            {score}
          </button>
        ))}
        <button
          type="button"
          className={`score-clear ${value === null ? "active" : ""}`}
          onClick={() => onChange(null)}
        >
          Not evaluated
        </button>
      </div>
    </div>
  );
}

export function CandidateAssessment({ candidate, role }: { candidate: Candidate; role: RoleDefinition }) {
  const storageKey = `purrfecthire:${candidate.id}`;
  const [scores, setScores] = useState<Record<string, Score>>(() => createInitialScores(role, candidate));
  const [logistics, setLogistics] = useState<Record<string, string | boolean | null>>(() =>
    createInitialLogistics(role, candidate),
  );
  const [notes, setNotes] = useState(candidate.notes ?? "");
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          scores?: Record<string, Score>;
          logistics?: Record<string, string | boolean | null>;
          notes?: string;
        };
        if (parsed.scores) setScores((current) => ({ ...current, ...parsed.scores }));
        if (parsed.logistics) setLogistics((current) => ({ ...current, ...parsed.logistics }));
        if (typeof parsed.notes === "string") setNotes(parsed.notes);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ scores, logistics, notes }));
  }, [hydrated, logistics, notes, scores, storageKey]);

  const result = useMemo(() => evaluateCandidate(role, scores, logistics), [role, scores, logistics]);

  const brief = useMemo(() => {
    const score = (value: number | null) => (value === null ? "Not complete" : `${value.toFixed(2)} / 5`);
    return `${candidate.name} — ${role.role}\n${role.client}\n\nTechnical: ${score(result.technicalScore)}\nOperating / Cultural: ${score(result.operatingScore)}\nOverall: ${score(result.overallScore)}\nDecision: ${result.decision}\n\nDecision notes:\n${result.reasons.map((reason) => `- ${reason}`).join("\n")}\n\nRecruiter notes:\n${notes || "Not added yet."}`;
  }, [candidate.name, notes, result, role.client, role.role]);

  async function copyBrief() {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function resetAssessment() {
    setScores(createInitialScores(role, candidate));
    setLogistics(createInitialLogistics(role, candidate));
    setNotes(candidate.notes ?? "");
    window.localStorage.removeItem(storageKey);
  }

  return (
    <div className="assessment-layout">
      <div className="assessment-main">
        <div className="candidate-heading">
          <div>
            <div className="eyebrow">{role.client} · {role.role}</div>
            <h1>{candidate.name}</h1>
            <div className="candidate-meta">
              {[candidate.currentRole, candidate.currentCompany, candidate.location].filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="candidate-actions">
            {candidate.linkedin ? (
              <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="button button-secondary">
                LinkedIn <ExternalLink size={14} />
              </a>
            ) : null}
            <button type="button" onClick={resetAssessment} className="button button-ghost">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        <section className="score-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">50% of overall score</span>
              <h2>Technical</h2>
            </div>
            <div className="section-score">
              <strong>{result.technicalScore?.toFixed(2) ?? "—"}</strong>
              <span>{result.technicalCoverage}% evaluated</span>
            </div>
          </div>
          <div className="criterion-list">
            {role.technical.map((criterion) => (
              <CriterionRow
                key={criterion.id}
                criterion={criterion}
                value={scores[criterion.id] ?? null}
                onChange={(value) => setScores((current) => ({ ...current, [criterion.id]: value }))}
              />
            ))}
          </div>
        </section>

        <section className="score-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">50% of overall score</span>
              <h2>Operating / Cultural</h2>
            </div>
            <div className="section-score">
              <strong>{result.operatingScore?.toFixed(2) ?? "—"}</strong>
              <span>{result.operatingCoverage}% evaluated</span>
            </div>
          </div>
          <p className="section-intro">
            Observable work behaviors only: ownership, ambiguity, communication and collaboration relevant to this role.
          </p>
          <div className="criterion-list">
            {role.operating.map((criterion) => (
              <CriterionRow
                key={criterion.id}
                criterion={criterion}
                value={scores[criterion.id] ?? null}
                onChange={(value) => setScores((current) => ({ ...current, [criterion.id]: value }))}
              />
            ))}
          </div>
        </section>

        <section className="score-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Required before presenting</span>
              <h2>Logistics & candidate conditions</h2>
            </div>
          </div>
          <div className="logistics-grid">
            {role.logistics.map((check) => (
              <label key={check.id} className="logistic-field">
                <span>{check.label}</span>
                {check.type === "boolean" ? (
                  <div className="boolean-control">
                    {[
                      { label: "Unknown", value: null },
                      { label: "Yes", value: true },
                      { label: "No", value: false },
                    ].map((option) => (
                      <button
                        type="button"
                        key={option.label}
                        className={logistics[check.id] === option.value ? "active" : ""}
                        onClick={() => setLogistics((current) => ({ ...current, [check.id]: option.value }))}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    value={typeof logistics[check.id] === "string" ? String(logistics[check.id]) : ""}
                    onChange={(event) =>
                      setLogistics((current) => ({ ...current, [check.id]: event.target.value }))
                    }
                    placeholder={check.placeholder}
                  />
                )}
              </label>
            ))}
          </div>
        </section>

        <section className="score-section notes-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Optional</span>
              <h2>Recruiter notes</h2>
            </div>
          </div>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Capture the most important interview context. Notes are not required to assign a score."
            rows={6}
          />
        </section>
      </div>

      <aside className="decision-panel">
        <span className="eyebrow">Live decision</span>
        <div className={`decision-badge decision-${decisionClass(result.decision)}`}>{result.decision}</div>
        <div className="overall-score">
          <strong>{result.overallScore?.toFixed(2) ?? "—"}</strong>
          <span>Overall / 5</span>
        </div>
        <div className="mini-scores">
          <div><span>Technical</span><strong>{result.technicalScore?.toFixed(2) ?? "—"}</strong></div>
          <div><span>Operating</span><strong>{result.operatingScore?.toFixed(2) ?? "—"}</strong></div>
        </div>

        <div className="decision-reasons">
          <span className="panel-label">Why</span>
          {result.reasons.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </div>

        {result.unknownGates.length ? (
          <div className="decision-reasons">
            <span className="panel-label">Still needs validation</span>
            {[...role.technical, ...role.operating]
              .filter((criterion) => result.unknownGates.includes(criterion.id))
              .map((criterion) => (
                <p key={criterion.id}>{criterion.label}</p>
              ))}
            {role.logistics
              .filter((check) => result.unknownGates.includes(check.id))
              .map((check) => (
                <p key={check.id}>{check.label}</p>
              ))}
          </div>
        ) : null}

        <button type="button" className="button button-primary button-full" onClick={copyBrief}>
          {copied ? <Check size={15} /> : <Clipboard size={15} />}
          {copied ? "Copied" : "Copy candidate brief"}
        </button>
        <p className="autosave-note">This prototype autosaves locally in your browser. Supabase persistence is the next integration step.</p>
      </aside>
    </div>
  );
}
