import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { candidates } from "@/lib/mock-data";
import { roles } from "@/lib/scorecards";

export default function RolesPage() {
  return (
    <AppShell active="roles">
      <div className="page-header">
        <span className="eyebrow">Scorecard library</span>
        <h1>Roles</h1>
        <p>Open a role to review its hiring bar, weights, hard gates and the candidates attached to that search.</p>
      </div>

      <section className="dashboard-section">
        <div className="role-grid">
          {roles.map((role) => {
            const candidateCount = candidates.filter((candidate) => candidate.roleSlug === role.slug).length;
            const hardGateCount = [...role.technical, ...role.operating].filter((criterion) => criterion.hardGate).length;

            return (
              <Link href={`/roles/${role.slug}`} className="role-card" key={role.slug}>
                <div>
                  <span className="role-client">{role.client}</span>
                  <h3>{role.role}</h3>
                  <p>{role.summary}</p>
                </div>
                <div className="role-card-footer">
                  <span>{candidateCount} candidate{candidateCount === 1 ? "" : "s"}</span>
                  <span>{hardGateCount} hard gates →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
