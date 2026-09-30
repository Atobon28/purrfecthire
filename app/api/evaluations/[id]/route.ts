import { NextResponse } from "next/server";
import { getRole } from "@/lib/scorecards";
import { evaluateCandidate } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Score } from "@/lib/types";

type UpdatePayload = {
  scores?: Record<string, Score>;
  logistics?: Record<string, string | boolean | null>;
  evidence?: Record<string, string>;
  practicalScores?: Record<string, Score>;
  practicalEvidence?: Record<string, string>;
  notes?: string;
  screeningCompleted?: boolean;
  completed?: boolean;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as UpdatePayload;
    const supabase = getSupabaseAdmin();

    const { data: assessment, error: readError } = await supabase
      .from("assessments")
      .select("id,candidate_id,scores,logistics,evidence,practical_scores,practical_evidence,recruiter_notes,screening_completed,completed,candidates(role_slug)")
      .eq("id", id)
      .single();

    if (readError || !assessment) {
      return NextResponse.json({ error: "Evaluation not found." }, { status: 404 });
    }

    const candidate = Array.isArray((assessment as any).candidates)
      ? (assessment as any).candidates[0]
      : (assessment as any).candidates;
    const roleSlug = candidate?.role_slug;
    const role = roleSlug ? getRole(roleSlug) : null;

    if (!role) {
      return NextResponse.json({ error: "The role linked to this evaluation is not valid." }, { status: 400 });
    }

    const scores = payload.scores ?? ((assessment as any).scores ?? {});
    const logistics = payload.logistics ?? ((assessment as any).logistics ?? {});
    const evidence = payload.evidence ?? ((assessment as any).evidence ?? {});
    const practicalScores = payload.practicalScores ?? ((assessment as any).practical_scores ?? {});
    const practicalEvidence = payload.practicalEvidence ?? ((assessment as any).practical_evidence ?? {});
    const notes = payload.notes ?? ((assessment as any).recruiter_notes ?? "");
    const screeningCompleted = payload.screeningCompleted ?? Boolean((assessment as any).screening_completed);
    const completed = payload.completed ?? Boolean((assessment as any).completed);
    const result = evaluateCandidate(role, scores, logistics);

    const { data: updated, error: updateError } = await supabase
      .from("assessments")
      .update({
        scores,
        logistics,
        evidence,
        practical_scores: practicalScores,
        practical_evidence: practicalEvidence,
        recruiter_notes: notes,
        technical_score: result.technicalScore,
        operating_score: result.operatingScore,
        overall_score: result.overallScore,
        decision: result.decision,
        decision_reasons: result.reasons,
        screening_completed: screeningCompleted,
        completed,
      })
      .eq("id", id)
      .select("id,updated_at")
      .single();

    if (updateError || !updated) throw updateError ?? new Error("Assessment update failed");

    return NextResponse.json({ ok: true, updatedAt: updated.updated_at });
  } catch (error) {
    console.error("Failed to update evaluation", error);
    return NextResponse.json({ error: "The evaluation could not be saved." }, { status: 500 });
  }
}
