import { NextResponse } from "next/server";
import { getRole } from "@/lib/scorecards";
import { evaluateCandidate } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Score } from "@/lib/types";

export const dynamic = "force-dynamic";

type EvaluationPayload = {
  candidateName?: string;
  roleSlug?: string;
  linkedin?: string;
  currentRole?: string;
  currentCompany?: string;
  location?: string;
  scores?: Record<string, Score>;
  logistics?: Record<string, string | boolean | null>;
  notes?: string;
  completed?: boolean;
};

function mapEvaluation(candidate: any, assessment: any) {
  return {
    id: assessment.id,
    candidateId: candidate.id,
    candidateName: candidate.name,
    roleSlug: candidate.role_slug,
    linkedin: candidate.linkedin_url ?? undefined,
    currentRole: candidate.current_role ?? undefined,
    currentCompany: candidate.current_company ?? undefined,
    location: candidate.location ?? undefined,
    scores: assessment.scores ?? {},
    logistics: assessment.logistics ?? {},
    notes: assessment.recruiter_notes ?? "",
    completed: Boolean(assessment.completed),
    createdAt: assessment.created_at,
    updatedAt: assessment.updated_at,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("candidates")
      .select("id,name,role_slug,linkedin_url,current_role,current_company,location,assessments(id,scores,logistics,recruiter_notes,completed,created_at,updated_at)")
      .order("updated_at", { referencedTable: "assessments", ascending: false });

    if (error) throw error;

    const evaluations = (data ?? [])
      .flatMap((candidate: any) => {
        const assessments = Array.isArray(candidate.assessments) ? candidate.assessments : [];
        return assessments.map((assessment: any) => mapEvaluation(candidate, assessment));
      })
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error("Failed to load evaluations", error);
    return NextResponse.json({ error: "No se pudieron cargar las evaluaciones." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as EvaluationPayload;
    const candidateName = payload.candidateName?.trim();
    const roleSlug = payload.roleSlug?.trim();
    const role = roleSlug ? getRole(roleSlug) : null;

    if (!candidateName || !roleSlug || !role) {
      return NextResponse.json({ error: "Candidato y vacante son obligatorios." }, { status: 400 });
    }

    const scores = payload.scores ?? {};
    const logistics = payload.logistics ?? {};
    const result = evaluateCandidate(role, scores, logistics);
    const supabase = getSupabaseAdmin();

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({
        name: candidateName,
        role_slug: roleSlug,
        linkedin_url: payload.linkedin?.trim() || null,
        current_role: payload.currentRole?.trim() || null,
        current_company: payload.currentCompany?.trim() || null,
        location: payload.location?.trim() || null,
      })
      .select("id,name,role_slug,linkedin_url,current_role,current_company,location")
      .single();

    if (candidateError || !candidate) throw candidateError ?? new Error("Candidate insert failed");

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .insert({
        candidate_id: candidate.id,
        scores,
        logistics,
        recruiter_notes: payload.notes ?? "",
        technical_score: result.technicalScore,
        operating_score: result.operatingScore,
        overall_score: result.overallScore,
        decision: result.decision,
        decision_reasons: result.reasons,
        completed: Boolean(payload.completed),
      })
      .select("id,scores,logistics,recruiter_notes,completed,created_at,updated_at")
      .single();

    if (assessmentError || !assessment) {
      await supabase.from("candidates").delete().eq("id", candidate.id);
      throw assessmentError ?? new Error("Assessment insert failed");
    }

    return NextResponse.json({ evaluation: mapEvaluation(candidate, assessment) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create evaluation", error);
    return NextResponse.json({ error: "No se pudo crear la evaluación." }, { status: 500 });
  }
}
