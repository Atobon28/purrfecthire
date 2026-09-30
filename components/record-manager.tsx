"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";

type EvaluationListItem = {
  id: string;
  candidateName: string;
  roleSlug: string;
  currentRole?: string;
  currentCompany?: string;
  updatedAt: string;
};

export function RecordManager() {
  const [open, setOpen] = useState(false);
  const [evaluations, setEvaluations] = useState<EvaluationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadEvaluations() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/evaluations?t=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Load failed");
      const data = (await response.json()) as { evaluations?: EvaluationListItem[] };
      setEvaluations(data.evaluations ?? []);
    } catch {
      setError("We could not load the saved records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void loadEvaluations();
  }, [open]);

  async function deleteEvaluation(evaluation: EvaluationListItem) {
    const confirmed = window.confirm(`Delete ${evaluation.candidateName}? This removes the saved evaluation and cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(evaluation.id);
    setError(null);
    try {
      const response = await fetch(`/api/evaluations/${evaluation.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setEvaluations((current) => current.filter((item) => item.id !== evaluation.id));
      window.location.reload();
    } catch {
      setError("The record could not be deleted.");
      setDeletingId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 60,
          border: "1px solid #d8d8d1",
          borderRadius: 10,
          background: "#fff",
          color: "#575752",
          padding: "9px 12px",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          fontSize: 11,
          fontWeight: 650,
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,.08)",
        }}
      >
        <Trash2 size={14} /> Manage records
      </button>

      {open ? (
        <div
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(20,20,18,.28)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <section style={{ width: "min(620px, 100%)", maxHeight: "78vh", overflow: "hidden", borderRadius: 16, background: "#fff", border: "1px solid #deded8", boxShadow: "0 24px 70px rgba(0,0,0,.18)" }}>
            <header style={{ padding: "18px 20px", borderBottom: "1px solid #ecece6", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <strong style={{ display: "block", fontSize: 14 }}>Manage saved records</strong>
                <span style={{ color: "#81817a", fontSize: 11 }}>Delete evaluations you no longer want in the shared history.</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ border: 0, background: "transparent", color: "#6f6f69", cursor: "pointer", padding: 5 }}><X size={17} /></button>
            </header>

            <div style={{ maxHeight: "60vh", overflowY: "auto", padding: 12 }}>
              {loading ? <div style={{ padding: 28, display: "flex", justifyContent: "center", color: "#777770" }}><LoaderCircle size={18} style={{ animation: "spin 1s linear infinite" }} /></div> : null}
              {error ? <p style={{ margin: 8, color: "#8a4141", fontSize: 11 }}>{error}</p> : null}
              {!loading && evaluations.length === 0 ? <p style={{ margin: 12, color: "#85857e", fontSize: 12 }}>No saved records.</p> : null}
              {!loading ? evaluations.map((evaluation) => (
                <div key={evaluation.id} style={{ padding: "12px 10px", borderBottom: "1px solid #efefe9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{evaluation.candidateName}</strong>
                    <span style={{ display: "block", marginTop: 3, color: "#81817a", fontSize: 10 }}>{[evaluation.currentRole, evaluation.currentCompany].filter(Boolean).join(" · ") || evaluation.roleSlug}</span>
                    <span style={{ display: "block", marginTop: 3, color: "#aaa9a2", fontSize: 9 }}>Updated {new Date(evaluation.updatedAt).toLocaleDateString("en", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteEvaluation(evaluation)}
                    disabled={deletingId === evaluation.id}
                    style={{ border: "1px solid #ead8d8", borderRadius: 9, background: "#fffafa", color: "#8a4141", padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6, cursor: deletingId === evaluation.id ? "wait" : "pointer", fontSize: 10, fontWeight: 650, flex: "0 0 auto" }}
                  >
                    {deletingId === evaluation.id ? <LoaderCircle size={13} /> : <Trash2 size={13} />} Delete
                  </button>
                </div>
              )) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
