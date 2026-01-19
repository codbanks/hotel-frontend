import React from "react";
import { numericCols, fmt } from "./ledgerUtils";

export default function LedgerTable({
  derivedRows = [],
  cashAccounts = {},
  currentDate,
  setCellValue,
  setCashValue,
  cashTotals = {},
  totals = {},
  debtorsInRes = 0,
  inputRefs,
  onSaveRow,
}) {
  const displayNumericOrder = [
    "balBf", "acc", "food", "bar", "laundry", "swimming",
    "roomHire", "other", "tCharge", "usdSwipe", "ecoCash",
    "zigSwipe", "cash", "tLedger", "bankTr",
  ];

  const Header = ({ title }) => (
    <th><span dangerouslySetInnerHTML={{ __html: title }} /></th>
  );

  const cash = cashAccounts[currentDate] || Object.fromEntries(displayNumericOrder.map((c) => [c, 0]));

  return (
    <div className="ledger-table-wrap">
      <table className="ledger-table">
        {/* ✅ FIXED: Widths now sum exactly to 100% */}
        <colgroup>
          <col style={{ width: "2%" }} />  {/* # */}
          <col style={{ width: "5%" }} />  {/* Folio (Increased) */}
          <col style={{ width: "13%" }} /> {/* Name (Increased) */}
          <col style={{ width: "4%" }} />  {/* Pax (Increased) */}
          <col style={{ width: "5%" }} />  {/* Bal Bf */}
          
          {/* 7 columns x 4% = 28% */}
          <col style={{ width: "4%" }} /> {/* Acc */}
          <col style={{ width: "4%" }} /> {/* Food */}
          <col style={{ width: "4%" }} /> {/* Bar */}
          <col style={{ width: "4%" }} /> {/* Lndry */}
          <col style={{ width: "4%" }} /> {/* Swim */}
          <col style={{ width: "4%" }} /> {/* Room */}
          <col style={{ width: "4%" }} /> {/* Oth */}

          {/* 8 columns x 5% = 40% */}
          <col style={{ width: "5%" }} /> {/* T Chrg */}
          <col style={{ width: "5%" }} /> {/* USD */}
          <col style={{ width: "5%" }} /> {/* Eco */}
          <col style={{ width: "5%" }} /> {/* Zig */}
          <col style={{ width: "5%" }} /> {/* Cash */}
          <col style={{ width: "5%" }} /> {/* Ledg */}
          <col style={{ width: "5%" }} /> {/* Bank */}
          <col style={{ width: "5%" }} /> {/* Bal CF */}
          
          <col style={{ width: "3%" }} /> {/* Act */}
        </colgroup>

        <thead>
          <tr>
            <th>#</th>
            <th>Folio</th>
            <th>Guest Name</th>
            <th>Pax</th>
            <Header title="Bal<br/>B/F" />
            <Header title="Acc" />
            <Header title="Food" />
            <Header title="Bar" />
            <Header title="Lndry" />
            <Header title="Pool" />
            <Header title="Room" />
            <Header title="Other" />
            <Header title="Total<br/>Chrg" />
            <Header title="USD<br/>Swp" />
            <Header title="Eco" />
            <Header title="ZIG" />
            <Header title="Cash" />
            <Header title="Ledg" />
            <Header title="Bank" />
            <Header title="Bal<br/>C/F" />
            <th>💾</th>
          </tr>
        </thead>

        <tbody>
          {derivedRows.map((r, ri) => (
            <tr key={ri}>
              <td style={{textAlign: 'center', color: '#666'}}>{r.row}</td>
              <td>
                <input
                  type="text"
                  value={r.folio || ""}
                  onChange={(e) => setCellValue(ri, "folio", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  ref={(el) => (inputRefs.current[`${ri}-guestName`] = el)}
                  value={r.guestName || ""}
                  onChange={(e) => setCellValue(ri, "guestName", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  style={{textAlign: 'center'}}
                  value={r.pax || ""}
                  onChange={(e) => setCellValue(ri, "pax", e.target.value)}
                />
              </td>

              {displayNumericOrder.map((f) => (
                <td key={f}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="-"
                    value={r[f] === 0 ? "" : r[f]} // Hide 0s for cleaner look
                    onChange={(e) => setCellValue(ri, f, e.target.value)}
                  />
                </td>
              ))}

              <td style={{textAlign: 'right', paddingRight: '4px', fontWeight: 'bold', color: r.balCf < 0 ? 'red' : 'inherit'}}>
                {fmt(r.balCf)}
              </td>

              <td>
                <button
                  className={`save-row-btn ${r._saveStatus === "saved" ? "saved" : ""}`}
                  onClick={() => onSaveRow(ri)}
                  title="Save Row"
                >
                  {r._saveStatus === "saved" ? "✅" : "💾"}
                </button>
              </td>
            </tr>
          ))}

          {/* CASH ROW */}
          <tr className="cash-row">
            <td colSpan={4} style={{textAlign: 'right', paddingRight: '10px'}}>CASH ACC</td>
            {displayNumericOrder.map((f) => (
              <td key={f}>
                <input
                  type="number"
                  step="0.01"
                  value={cash[f] === 0 ? "" : cash[f]}
                  onChange={(e) => setCashValue(f, e.target.value)}
                />
              </td>
            ))}
            <td style={{textAlign: 'right', paddingRight: '4px'}}>{fmt(cashTotals.balCf)}</td>
            <td></td>
          </tr>

          {/* TOTALS ROW */}
          <tr className="totals-row">
            <td colSpan={4} style={{textAlign: 'right', paddingRight: '10px'}}>TOTALS</td>
            {displayNumericOrder.map((f) => (
              <td key={f} style={{textAlign: 'right', paddingRight: '4px'}}>{fmt(totals[f])}</td>
            ))}
            <td style={{textAlign: 'right', paddingRight: '4px'}}>{fmt(totals.balCf)}</td>
            <td></td>
          </tr>

          {/* DEBTORS ROW */}
          <tr className="debtors-row">
            <td colSpan={21}>
              Debtors in Residence: <span style={{color: 'var(--pumpkin)', fontWeight: 'bold'}}>{fmt(debtorsInRes)}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{height: '80px'}}></div> {/* Scroll padding */}
    </div>
  );
}