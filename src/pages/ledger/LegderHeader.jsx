// components/LedgerHeader.jsx
import React from "react";
import { toNumber } from "../utils/ledgerUtils";

export default function LedgerHeader({ addRow, saveAll, savingAll, derivedRows, currentDate }) {
  const exportCSV = () => {
    const header = ["Row","Folio","Guest Name","Pax","Food","Bar","Laundry","Swimming","Room hire","Other","Bal B/f","T Charge","USD Swipe","EcoCash","ZIG Swipe","Cash","T/Ledger","Bank Tr","Bal C/F"];
    const lines = [header.join(",")];
    derivedRows.forEach(r => {
      const vals = [
        r.row,
        `"${r.folio}"`,
        `"${r.guestName}"`,
        `"${r.pax}"`,
        ...["food","bar","laundry","swimming","roomHire","other","balBf","tCharge","usdSwipe","ecoCash","zigSwipe","cash","tLedger","bankTr","balCf"].map(f => toNumber(r[f]).toFixed(2))
      ];
      lines.push(vals.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ledger_${currentDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="ledger-header">
      <h2>📒 Ledger — Excel-like Entry</h2>
      <div className="actions">
        <button className="btn" onClick={addRow}>➕ Add row</button>
        <button className="btn outline" onClick={saveAll} disabled={savingAll}>
          {savingAll ? "Saving..." : "Save All"}
        </button>
        <button className="btn" onClick={exportCSV}>Export CSV</button>
      </div>
    </div>
  );
}
