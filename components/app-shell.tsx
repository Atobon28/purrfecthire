import Link from "next/link";
import { BriefcaseBusiness, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="PurrfectHire home">
          <span className="brand-mark">P</span>
          <span>PurrfectHire</span>
        </Link>
        <nav className="nav">
          <Link href="/" className="nav-item nav-item-active">
            <UsersRound size={17} strokeWidth={1.8} />
            Candidates
          </Link>
          <Link href="/#roles" className="nav-item">
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
