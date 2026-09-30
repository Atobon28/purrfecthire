"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        border: "1px solid #d8d8d2",
        background: "white",
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
      <Printer size={14} /> Guardar como PDF
    </button>
  );
}
