import Link from "next/link";
import { BriefcaseBusiness, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  active?: "candidates" | "roles";
};

export function AppShell({ children, active = "candidates" }: AppShellProps) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="PurrfectHire home">
          <span className="brand-mark">P</span>
          <span>PurrfectHire</span>
        </Link>
        <nav className="nav">
          <Link href="/" className={`nav-item ${active === "candidates" ? "nav-item-active" : ""}`}>
            <UsersRound size={17} strokeWidth={1.8} />
            Candidates
          </Link>
          <Link href="/roles" className={`nav-item ${active === "roles" ? "nav-item-active" : ""}`}>
            <BriefcaseBusiness size={17} strokeWidth={1.8} />
            Roles
          </Link>
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">MVP</span>
          Interview scorecards for recruiters.
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
