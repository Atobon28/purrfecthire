import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { candidates } from "@/lib/mock-data";
import { getRole } from "@/lib/scorecards";
import { evaluateCandidate } from "@/lib/scoring";
import type { Criterion } from "@/lib/types";

function CriterionPreview({ criterion }: { criterion: Criterion }) {
  return (
    <div className="criterion-row">
      <div className="criterion-copy">
        <div className="criterion-title-line">
          <h3>{criterion.label}</h3>
          <span className={`priority priority-${criterion.priority}`}>{criterion.priority}</span>
          <span className="weight">{criterion.weight}%</span>
          {criterion.hardGate ? (
            <span className="hard-gate">Hard gate · min {criterion.minimumScore ?? 4}</span>
          ) : null}
        </div>
        <p className="primary-question">{criterion.question}</p>
      </div>
    </div>
  );
}

export default async function RoleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  const roleCandidates = candidates.filter((candidate) => candidate.roleSlug === role.slug);
  const hardGateCount = [...role.technical, ...role.operating].filter((criterion) => criterion.hardGate).length;

  return (
    <AppShell active="roles">
      <div className="candidate-heading">
        <div>
          <Link href="/roles" className="muted-copy">
            <ArrowLeft size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />
            All roles
          </Link>
          <div className="eyebrow" style={{ marginTop: 18 }}>{role.client}</div>
          <h1>{role.role}</h1>
          <div className="candidate-meta">{role.summary}</div>
        </div>
      </div>

      <section className="score-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Hiring bar</span>
            <h2>Scorecard structure</h2>
          </div>
          <div className="section-score">
            <strong>{hardGateCount}</strong>
            <span>hard gates</span>
          </div>
        </div>
        <div className="logistics-grid">
          <div className="logistic-field">
            <span>Technical</span>
            <strong>50% of overall score</strong>
          </div>
          <div className="logistic-field">
            <span>Operating / Cultural</span>
            <strong>50% of overall score</strong>
          </div>
        </div>
      </section>

      <section className="score-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">50% of overall</span>
            <h2>Technical</h2>
          </div>
        </div>
        <div className="criterion-list">
          {role.technical.map((criterion) => (
            <CriterionPreview key={criterion.id} criterion={criterion} />
          ))}
        </div>
      </section>

      <section className="score-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">50% of overall</span>
            <h2>Operating / Cultural</h2>
          </div>
        </div>
        <p className="section-intro">
          Observable work behaviors only. This is not a personality or “vibe” score.
        </p>
        <div className="criterion-list">
          {role.operating.map((criterion) => (
            <CriterionPreview key={criterion.id} criterion={criterion} />
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Interview pipeline</span>
            <h2>Candidates for this role</h2>
          </div>
        </div>
        <div className="candidate-table-wrap">
          <table className="candidate-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Technical</th>
                <th>Operating</th>
                <th>Overall</th>
                <th>Decision</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {roleCandidates.map((candidate) => {
                const result = evaluateCandidate(role, candidate.scores, candidate.logistics);
                return (
                  <tr key={candidate.id}>
                    <td>
                      <div className="candidate-cell">
                        <strong>{candidate.name}</strong>
                        <span>{candidate.currentCompany ?? "—"}</span>
                      </div>
                    </td>
                    <td>{result.technicalScore?.toFixed(2) ?? "—"}</td>
                    <td>{result.operatingScore?.toFixed(2) ?? "—"}</td>
                    <td>{result.overallScore?.toFixed(2) ?? "—"}</td>
                    <td>
                      <span className={`table-status table-status-${result.decision.toLowerCase()}`}>
                        {result.decision}
                      </span>
                    </td>
                    <td>
                      <Link href={`/candidates/${candidate.id}`} className="open-link" aria-label={`Open ${candidate.name}`}>
                        <ArrowUpRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
