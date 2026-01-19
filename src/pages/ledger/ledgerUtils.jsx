// ledgerUtils.js
export const API_BASE = "http://localhost:8000/api/v2"; // replace with your backend URL

// Numeric columns
export const numericCols = [
  "balBf", "acc", "food", "bar", "laundry", "swimming",
  "roomHire", "other", "tCharge", "usdSwipe", "ecoCash",
  "zigSwipe", "cash", "tLedger", "bankTr", "balCf"
];

// All columns
export const allCols = [
  "folio", "guestName", "pax",
  ...numericCols
];

// Default row generator
export function defaultRow(idx = 0) {
  const row = { id: null, row: idx + 1, _saveStatus: "new" };
  allCols.forEach(col => {
    row[col] = numericCols.includes(col) ? 0 : "";
  });
  return row;
}

// Safely convert to number
export function toNumber(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

// Format number nicely
export function fmt(val) {
  return (val ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Convert to YYYY-MM-DD
export function isoDate(d) {
  // Ensure we are working with a date object
  let date = new Date(d);
  
  // Handle case where date string might not specify time zone, forcing UTC midnight to avoid local time shifts
  if (typeof d === 'string' && !d.includes('T')) {
     date = new Date(d + 'T00:00:00');
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Get next date string
export function nextISODate(dateStr) {
  // Use T00:00:00 to treat the date as local midnight and avoid time zone issues
  const d = new Date(dateStr + 'T00:00:00'); 
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

// 🔥 Get previous date string (REQUIRED FOR addNewDateAutoBackward)
export function prevISODate(dateStr) {
  // Use T00:00:00 to treat the date as local midnight and avoid time zone issues
  const d = new Date(dateStr + 'T00:00:00'); 
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}