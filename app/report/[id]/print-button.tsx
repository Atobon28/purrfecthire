"use client";

import { FileDown } from "lucide-react";

type ReportMode = "theory" | "practical" | "full";

const labels: Record<ReportMode, string> = {
  theory: "Theoretical PDF",
  practical: "Practical PDF",
  full: "Full PDF",
};

export function PrintButton({ hasPractical }: { hasPractical: boolean }) {
  function printReport(mode: ReportMode) {
    const root = document.documentElement;
    root.dataset.pdfMode = mode;

    const originalTitle = document.title;
    const candidate = document.querySelector<HTMLElement>("[data-report-candidate]")?.innerText.trim();
    const suffix = mode === "theory" ? "Technical Screening" : mode === "practical" ? "Live Technical Assessment" : "Full Evaluation";
    document.title = `${candidate || "Candidate"} - ${suffix}`;

    const cleanup = () => {
      delete root.dataset.pdfMode;
      document.title = originalTitle;
    };

    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  }

  const modes: ReportMode[] = hasPractical ? ["theory", "practical", "full"] : ["full"];

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => printReport(mode)}
          style={{
            border: mode === "full" ? "1px solid #1d1d1b" : "1px solid #d8d8d2",
            background: mode === "full" ? "#1d1d1b" : "white",
            color: mode === "full" ? "white" : "#1d1d1b",
            borderRadius: 10,
            padding: "9px 12px",
            display: "inline-flex",
            gap: 7,
            alignItems: "center",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 650,
          }}
        >
          <FileDown size={14} /> {hasPractical ? labels[mode] : "Save as PDF"}
        </button>
      ))}
    </div>
  );
}
