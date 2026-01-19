// LedgerControls.jsx
import React from "react";

export default function LedgerControls({
  dates,
  visibleDates,
  visibleStartIndex,
  currentDateIndex,
  prevDate,
  nextDate,
  selectDate,
  addNewDateAuto,
  addNewDateAutoBackward,
  resetViewToLatestDate, // 🔥 RECEIVE NEW FUNCTION
  handleManualDateChange,
  addRow,
  saveAll,
  savingAll
}) {
  const getRealIndex = (visibleIndex) => visibleStartIndex + visibleIndex;

  return (
    <div className="ledger-bottom-bar">
      <div className="date-nav-bar">
        {/* Existing navigation buttons */}
        <button onClick={prevDate} disabled={currentDateIndex <= 0}>◀</button>

        <div className="date-tabs">
          {/* Button for creating previous dates */}
          <button 
            className="date-tab minus" 
            onClick={addNewDateAutoBackward} 
            title="Add previous day"
          >
            ➖
          </button>
          
          {/* Map only the visible dates */}
          {visibleDates.map((d, i) => {
            const realIndex = getRealIndex(i);
            const isActive = realIndex === currentDateIndex;

            return (
              <button
                key={d}
                className={`date-tab ${isActive ? "active" : ""}`}
                onClick={() => selectDate(realIndex)}
              >
                {d}
              </button>
            );
          })}
          {/* Button for creating next dates */}
          <button className="date-tab plus" onClick={addNewDateAuto} title="Add next day">＋</button>
        </div>

        <button
          onClick={nextDate}
          disabled={currentDateIndex >= dates.length - 1}
        >
          ▶
        </button>

        {/* Manual date picker */}
        <div className="manual-date-filter">
          <input type="date" onChange={handleManualDateChange} />
        </div>
      </div>

      <div className="actions">
        {/* 🔥 NEW RESET BUTTON */}
        <button 
          className="btn primary" 
          onClick={resetViewToLatestDate}
          title="Go back to the latest recorded date and clear extra tabs"
        >
          📅 Reset View
        </button>
        {/* ------------------- */}
        <button className="btn" onClick={addRow}>➕ Add row</button>
        <button className="btn outline" onClick={saveAll} disabled={savingAll}>
          {savingAll ? "Saving..." : "Save All"}
        </button>
        <button className="btn outline" onClick={() => window.print()}>Print</button>
      </div>
    </div>
  );
}