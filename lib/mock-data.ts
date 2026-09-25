import type { Candidate } from "./types";

export const candidates: Candidate[] = [
  {
    id: "demo-optery",
    name: "Demo Candidate",
    roleSlug: "optery-senior-backend",
    linkedin: "https://www.linkedin.com/",
    location: "LATAM",
    currentRole: "Senior Backend Engineer",
    currentCompany: "Sample Company",
    scores: {},
    logistics: {},
  },
  {
    id: "demo-casa",
    name: "AI Engineer Example",
    roleSlug: "casa-founding-engineer",
    currentRole: "Founding Engineer",
    currentCompany: "Sample Startup",
    scores: {},
    logistics: {},
  },
  {
    id: "demo-prosights",
    name: "CTO Example",
    roleSlug: "prosights-cto",
    currentRole: "Technical Founder",
    currentCompany: "Sample Venture",
    scores: {},
    logistics: {},
  },
];

export function getCandidate(id: string) {
  return candidates.find((candidate) => candidate.id === id);
}
