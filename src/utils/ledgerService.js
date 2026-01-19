import api from "../api/api";

const toNumber = (val) => parseFloat(val) || 0;

/**
 * syncToLedger
 * @param {string} guestName - Unique name to look for
 * @param {string} folio - "STAFF" or Room Number
 * @param {object} amounts - e.g., { food: 50, bar: 20 }
 * @param {string} date - ISO date string
 */
export const syncToLedger = async (guestName, folio, amounts, date = new Date().toISOString().split('T')[0]) => {
    try {
        // 1. Fetch current ledger for the date
        const res = await api.get(`/ledger/?date=${date}`);
        const existingRows = res.data;

        // 2. Security Check: Find if the name already exists
        const existingRow = existingRows.find(r => 
            r.guestName?.toLowerCase().trim() === guestName.toLowerCase().trim()
        );

        let payload = {
            date,
            guestName: guestName.toUpperCase(),
            folio: folio || "MISC"
        };

        if (existingRow) {
            // Update mode: Add new amounts to old amounts
            payload.id = existingRow.id;
            const columns = ["acc", "food", "bar", "laundry", "swimming", "roomHire", "other"];
            
            columns.forEach(col => {
                const newAmt = amounts[col] || 0;
                const oldAmt = toNumber(existingRow[col]);
                payload[col] = oldAmt + newAmt;
            });

            // Keep existing payment/bf values
            const metaCols = ["balBf", "usdSwipe", "ecoCash", "zigSwipe", "cash", "tLedger", "bankTr", "pax"];
            metaCols.forEach(col => {
                payload[col] = toNumber(existingRow[col]);
            });
        } else {
            // Creation mode: Set initial amounts
            payload = { ...payload, ...amounts };
        }

        // 3. Save to Backend
        await api.post("/ledger/", payload);
        console.log(`Ledger synced for ${guestName}`);
    } catch (err) {
        console.error("Ledger Sync Error:", err);
        throw err;
    }
};