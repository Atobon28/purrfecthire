import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CandidateAssessment } from "@/components/candidate-assessment";
import { getCandidate } from "@/lib/mock-data";
import { getRole } from "@/lib/scorecards";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) notFound();
  const role = getRole(candidate.roleSlug);
  if (!role) notFound();

  return (
    <AppShell>
      <CandidateAssessment candidate={candidate} role={role} />
    </AppShell>
  );
}
