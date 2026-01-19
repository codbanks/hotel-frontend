// LedgerStatsUpdater.jsx
// This updates ledger_stats for 33 fields (16 total_*, 16 cash_*, 1 debtors_in_res)

export default async function LedgerStatsUpdater(
  axiosInstance,
  date,
  cashTotals,
  totals,
  debtorsInRes
) {
  try {
    // Fetch existing stats for this date
    const res = await axiosInstance.get(`/ledger_stats/?date=${date}`);
    const existing = Array.isArray(res.data) && res.data.length ? res.data[0] : null;

    // Prepare payload
    const payload = { date, debtors_in_res: debtorsInRes };

    // Add cash_* fields
    Object.keys(cashTotals).forEach((k) => {
      if (k.startsWith("cash_") || k === "tCharge" || k === "balCf") {
        payload[k] = cashTotals[k] ?? 0;
      }
    });

    // Add total_* fields
    Object.keys(totals).forEach((k) => {
      if (k.startsWith("total_") || k === "tCharge" || k === "balCf") {
        payload[k] = totals[k] ?? 0;
      }
    });

    if (existing) {
      // Update only if something changed
      const needsUpdate = Object.keys(payload).some(
        (k) => Number(existing[k]) !== Number(payload[k])
      );
      if (needsUpdate) {
        await axiosInstance.put(`/ledger_stats/${existing.id}/`, payload);
        console.log("Ledger stats updated for date:", date);
      }
    } else {
      // Create if doesn't exist
      await axiosInstance.post("/ledger_stats/", payload);
      console.log("Ledger stats created for date:", date);
    }
  } catch (err) {
    console.error("LedgerStatsUpdater error:", err);
  }
}
