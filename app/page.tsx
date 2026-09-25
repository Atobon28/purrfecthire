import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { candidates } from "@/lib/mock-data";
import { getRole, roles } from "@/lib/scorecards";
import { evaluateCandidate } from "@/lib/scoring";

export default function HomePage() {
  return (
    <AppShell>
      <div className="page-header">
        <div>
          <span className="eyebrow">Recruiting workspace</span>
          <h1>Candidate decisions, not interview notes.</h1>
          <p>
            Technical and operating scorecards with hard gates, explicit unknowns and a clear Present / Hold / Reject outcome.
          </p>
        </div>
      </div>

      <section id="roles" className="dashboard-section">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Active searches</span>
            <h2>Roles</h2>
          </div>
        </div>
        <div className="role-grid">
          {roles.map((role) => {
            const candidateCount = candidates.filter((candidate) => candidate.roleSlug === role.slug).length;
            return (
              <div className="role-card" key={role.slug}>
                <div>
                  <span className="role-client">{role.client}</span>
                  <h3>{role.role}</h3>
                  <p>{role.summary}</p>
                </div>
                <div className="role-card-footer">
                  <span>{candidateCount} candidate{candidateCount === 1 ? "" : "s"}</span>
                  <span>{role.technical.length + role.operating.length} scored criteria</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">Interview pipeline</span>
            <h2>Candidates</h2>
          </div>
          <span className="muted-copy">Demo records until Supabase is connected.</span>
        </div>
        <div className="candidate-table-wrap">
          <table className="candidate-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role</th>
                <th>Technical</th>
                <th>Operating</th>
                <th>Overall</th>
                <th>Decision</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => {
                const role = getRole(candidate.roleSlug);
                if (!role) return null;
                const result = evaluateCandidate(role, candidate.scores, candidate.logistics);
                return (
                  <tr key={candidate.id}>
                    <td>
                      <div className="candidate-cell">
                        <strong>{candidate.name}</strong>
                        <span>{candidate.currentCompany ?? "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div className="candidate-cell">
                        <strong>{role.role}</strong>
                        <span>{role.client}</span>
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
