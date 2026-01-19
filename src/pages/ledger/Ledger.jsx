import React, { useEffect, useMemo, useRef, useState } from "react";
// We no longer import axios directly, we use our central 'api' tool
import api from "../../api/api"; 
import LedgerTable from "./LedgerTable";
import LedgerStatsUpdater from "./ledgerStatsUpdater";
import {
  API_BASE,
  numericCols,
  allCols,
  defaultRow,
  toNumber,
  isoDate,
  nextISODate,
  prevISODate,
} from "./ledgerUtils";
import "../../styles/Ledger.css";
import { useNavigate } from "react-router-dom";

import LedgerControls from "./LedgerControls";

export default function Ledger() {
  const navigate = useNavigate();

  const [dates, setDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(-1);
  const [ledgerByDate, setLedgerByDate] = useState({});
  const [cashAccounts, setCashAccounts] = useState({});
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingRows, setLoadingRows] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const inputRefs = useRef({});

  // ---------------------------------------------------------------------------
  // 🚀 AUTH LOGIC REMOVED
  // We deleted the local axiosInstance and interceptors here.
  // The 'api' import handles tokens, sessionStorage, and auto-refresh globally.
  // ---------------------------------------------------------------------------

  const chargeCols = [
    "acc",
    "food",
    "bar",
    "laundry",
    "swimming",
    "roomHire",
    "other",
  ];

  function computeBalCfForRow(row) {
    const tCharge = chargeCols.reduce((s, c) => s + toNumber(row[c]), 0);
    const balCf =
      toNumber(row.tCharge ?? tCharge) +
      toNumber(row.balBf) -
      toNumber(row.bankTr) -
      toNumber(row.tLedger) -
      toNumber(row.cash) -
      toNumber(row.zigSwipe) -
      toNumber(row.ecoCash) -
      toNumber(row.usdSwipe);
    return { tCharge, balCf };
  }

  async function fetchRowsFromApi(dateStr) {
    try {
      // ✅ Using 'api' instead of axiosInstance
      const res = await api.get(`/ledger/?date=${dateStr}`);
      if (!Array.isArray(res.data) || res.data.length === 0) return [defaultRow(0)];
      return res.data.map((r, idx) => {
        const row = defaultRow(idx);
        allCols.forEach((c) => {
          row[c] =
            r[c] !== undefined && r[c] !== null
              ? r[c]
              : numericCols.includes(c)
              ? 0
              : row[c];
        });
        row.id = r.id ?? null;
        row._saveStatus = "saved";
        row.row = idx + 1;
        return row;
      });
    } catch (err) {
      console.error("fetchRowsFromApi error:", err);
      return [defaultRow(0)];
    }
  }

  async function ensureDateCreatedWithCarry(prevDate, newDate) {
    if (ledgerByDate[newDate] && ledgerByDate[newDate].length) return ledgerByDate[newDate];
    
    let carryRows = [];

    if (prevDate) {
        let prevRows = [];
        if (ledgerByDate[prevDate] && ledgerByDate[prevDate].length) {
          prevRows = ledgerByDate[prevDate];
        } else {
          prevRows = await fetchRowsFromApi(prevDate);
          setLedgerByDate((prev) => ({ ...prev, [prevDate]: prevRows }));
        }

        prevRows.forEach((pr) => {
          const { tCharge, balCf } = computeBalCfForRow(pr);
          if (pr.guestName && String(pr.guestName).trim() !== "" && Number(balCf) !== 0) {
              const nr = {
                  ...defaultRow(carryRows.length),
                  guestName: pr.guestName,
                  folio: pr.folio ?? "",
                  pax: pr.pax ?? 0,
                  balBf: Number(balCf),
                  acc: 0, food: 0, bar: 0, laundry: 0, swimming: 0, roomHire: 0, other: 0, 
                  tCharge: 0, usdSwipe: 0, ecoCash: 0, zigSwipe: 0, cash: 0, tLedger: 0, bankTr: 0,
                  balCf: 0,
                  id: null,
                  _saveStatus: "new",
                  row: carryRows.length + 1,
              };
              carryRows.push(nr);
          }
        });
    }

    const initialRows = carryRows.length ? carryRows : [defaultRow(0)];
    
    setLedgerByDate((prev) => ({ ...prev, [newDate]: initialRows }));
    setCashAccounts((prev) => ({
      ...prev,
      [newDate]: Object.fromEntries(numericCols.map((c) => [c, 0])),
    }));

    return initialRows;
  }

  useEffect(() => {
    async function loadDates() {
      setLoadingDates(true);
      try {
        // ✅ Using 'api'
        const res = await api.get("/ledger_dates/");
        const list = Array.isArray(res.data) && res.data.length
          ? res.data.map((d) => isoDate(d)).sort()
          : [isoDate(new Date())];
        setDates(list);
        setCurrentDateIndex(list.length - 1);
      } catch {
        const today = isoDate(new Date());
        setDates([today]);
        setCurrentDateIndex(0);
      } finally {
        setLoadingDates(false);
      }
    }
    loadDates();
  }, []);

  const currentDate = dates[currentDateIndex];
  const rows = ledgerByDate[currentDate] ?? [];

  useEffect(() => {
    let mounted = true;
    async function ensureRowsFor(dateStr) {
      if (!dateStr) return;
      if (ledgerByDate[dateStr] && ledgerByDate[dateStr].length) return;
      setLoadingRows(true);
      try {
        const fetched = await fetchRowsFromApi(dateStr); 
        if (!mounted) return;
        setLedgerByDate((prev) => ({ ...prev, [dateStr]: fetched }));
      } catch {
        setLedgerByDate((prev) => ({ ...prev, [dateStr]: [defaultRow(0)] }));
      } finally {
        if (mounted) setLoadingRows(false);
      }
    }
    ensureRowsFor(currentDate);
    return () => { mounted = false; };
  }, [currentDate]);

  function setCellValue(index, col, raw) {
    setLedgerByDate((prev) => {
      const copy = { ...prev };
      const arr = [...(copy[currentDate] ?? [])];
      arr[index] = { ...arr[index], [col]: raw };
      copy[currentDate] = arr;
      return copy;
    });
  }

  function setCashValue(col, raw) {
    setCashAccounts((prev) => {
      const copy = { ...prev };
      const curr = copy[currentDate] || Object.fromEntries(numericCols.map((c) => [c, 0]));
      curr[col] = raw;
      copy[currentDate] = curr;
      return copy;
    });
  }

  function addRow() {
    setLedgerByDate((prev) => {
      const copy = { ...prev };
      const arr = [...(copy[currentDate] ?? [])];
      arr.push(defaultRow(arr.length));
      arr.forEach((r, i) => (r.row = i + 1));
      copy[currentDate] = arr;
      return copy;
    });
    setTimeout(() => inputRefs.current[`${rows.length}-guestName`]?.focus?.(), 50);
  }
  
  // 💻 UPDATED useMemo LOGIC FOR 2 VISIBLE DATES
  const { visibleDates, visibleStartIndex } = useMemo(() => {
    const maxVisible = 2;
    const totalDates = dates.length;

    if (totalDates <= maxVisible) {
      return { visibleDates: dates, visibleStartIndex: 0 };
    }

    let start;
    let end;
    
    if (currentDateIndex === 0) {
        start = 0;
    } 
    else if (currentDateIndex === totalDates - 1) {
        start = totalDates - maxVisible;
    }
    else {
        start = Math.max(0, currentDateIndex - (maxVisible - 1));
    }
    
    end = start + maxVisible;
    
    if (end > totalDates) {
        end = totalDates;
        start = end - maxVisible;
    }

    const visibleDates = dates.slice(start, end);

    return { visibleDates, visibleStartIndex: start };
  }, [dates, currentDateIndex]);

  const derivedRows = useMemo(() => {
    return (ledgerByDate[currentDate] ?? []).map((r, idx) => {
      const row = { ...r };
      row.tCharge = chargeCols.reduce((s, c) => s + toNumber(row[c]), 0);
      row.balCf =
        toNumber(row.tCharge) +
        toNumber(row.balBf) -
        toNumber(row.bankTr) -
        toNumber(row.tLedger) -
        toNumber(row.cash) -
        toNumber(row.zigSwipe) -
        toNumber(row.ecoCash) -
        toNumber(row.usdSwipe);
      row.row = idx + 1;
      return row;
    });
  }, [ledgerByDate, currentDate]);

  const cashTotals = useMemo(() => {
    const cash = cashAccounts[currentDate] || Object.fromEntries(numericCols.map((c) => [c, 0]));
    const tCharge = chargeCols.reduce((sum, c) => sum + toNumber(cash[c]), 0);
    const balCf =
      tCharge +
      toNumber(cash.balBf) -
      toNumber(cash.bankTr) -
      toNumber(cash.tLedger) -
      toNumber(cash.cash) -
      toNumber(cash.zigSwipe) -
      toNumber(cash.ecoCash) -
      toNumber(cash.usdSwipe);
    return { ...cash, tCharge, balCf };
  }, [cashAccounts, currentDate]);

  const totals = useMemo(() => {
    const t = Object.fromEntries(numericCols.map((c) => [c, 0]));
    t.balCf = 0;
    derivedRows.forEach((r) => {
      numericCols.forEach((c) => (t[c] += toNumber(r[c])));
      t.balCf += toNumber(r.balCf);
    });
    return t;
  }, [derivedRows]);

  const debtorsInRes = useMemo(
    () =>
      totals.tCharge -
      totals.usdSwipe -
      totals.ecoCash -
      totals.zigSwipe -
      totals.cash -
      totals.tLedger -
      totals.bankTr,
    [totals]
  );

  async function saveRow(index) {
    const r = derivedRows[index];
    if (!r) return;
    if (!window.confirm("Save this row?")) return;
    try {
      const payload = { id: r.id || null, date: currentDate };
      allCols.forEach((c) => payload[c] = toNumber(r[c]));
      payload.folio = r.folio || "";
      payload.guestName = r.guestName || "";
      
      // ✅ Using 'api'
      await api.post("/ledger/", payload);
      
      setLedgerByDate((prev) => {
        const copy = { ...prev };
        const arr = [...(copy[currentDate] ?? [])];
        arr[index] = { ...arr[index], _saveStatus: "saved" };
        copy[currentDate] = arr;
        return copy;
      });
      // ✅ Pass 'api' to the stats updater
      await LedgerStatsUpdater(api, currentDate, cashTotals, totals, debtorsInRes);
      alert("✅ Row and stats saved!");
    } catch (err) {
      console.error("Save row error:", err);
      alert("⚠️ Error saving row or stats. Check console.");
    }
  }

  async function saveAll() {
    setSavingAll(true);
    try {
      for (const r of derivedRows) {
        const payload = { id: r.id || null, date: currentDate };
        allCols.forEach((c) => payload[c] = toNumber(r[c]));
        payload.folio = r.folio || "";
        payload.guestName = r.guestName || "";
        // ✅ Using 'api'
        await api.post("/ledger/", payload);
      }
      // ✅ Pass 'api'
      await LedgerStatsUpdater(api, currentDate, cashTotals, totals, debtorsInRes);
      setLedgerByDate((prev) => {
        const copy = { ...prev };
        copy[currentDate] =
          (copy[currentDate] || []).map((r) => ({ ...r, _saveStatus: "saved" }));
        return copy;
      });
      alert("✅ All rows and stats saved!");
    } catch (err) {
      console.error("Save all error:", err);
      alert("⚠️ Error saving rows or stats. Check console.");
    } finally {
      setSavingAll(false);
    }
  }

  // Helper function to find the latest date string from the dates array
  const getLatestDate = () => dates.length > 0 ? dates[dates.length - 1] : isoDate(new Date());

  // 🔥 RESET FUNCTION
  async function resetViewToLatestDate() {
    const latestDate = getLatestDate();
    
    // 1. Filter the dates array to only contain the latest date
    const newDates = [latestDate];
    setDates(newDates);

    // 2. Set the current index to 0 (since it's the only element)
    setCurrentDateIndex(0);
    
    // 3. Ensure the latest date's rows are fetched/loaded 
    await ensureDateCreatedWithCarry(null, latestDate); 
    
    // Optional: Clear ledgerByDate and cashAccounts of dates no longer in the array
    setLedgerByDate(prev => {
        if (prev[latestDate]) {
          return { [latestDate]: prev[latestDate] };
        }
        return {};
    });
    setCashAccounts(prev => {
        if (prev[latestDate]) {
          return { [latestDate]: prev[latestDate] };
        }
        return {};
    });
  }
  // ----------------------------------------------------

  async function addNewDateAuto() {
    const baseDate = dates.length ? dates[dates.length - 1] : isoDate(new Date());
    const newDate = nextISODate(baseDate);
    setDates((prev) => {
      const next = [...new Set([...prev, newDate])].sort();
      setCurrentDateIndex(next.indexOf(newDate));
      return next;
    });
    await ensureDateCreatedWithCarry(baseDate, newDate);
  }
  
  async function addNewDateAutoBackward() {
    const baseDate = dates.length ? dates[0] : isoDate(new Date());
    const newDate = prevISODate(baseDate);
    const prevPrevDate = prevISODate(newDate);

    let newDates = [...new Set([...dates, newDate])].sort();
    setDates(newDates);
    
    await ensureDateCreatedWithCarry(prevPrevDate, newDate);
    
    setCurrentDateIndex(newDates.indexOf(newDate));
  }

  async function prevDate() {
    if (currentDateIndex > 0) {
      const newIndex = currentDateIndex - 1;
      const target = dates[newIndex];
      
      const prevDateIndex = newIndex - 1 >= 0 ? newIndex - 1 : null;
      const prevDate = prevDateIndex !== null ? dates[prevDateIndex] : null;
      
      await ensureDateCreatedWithCarry(prevDate, target);
      setCurrentDateIndex(newIndex);
    }
  }

  async function nextDate() {
    if (currentDateIndex < dates.length - 1) {
      setCurrentDateIndex(currentDateIndex + 1);
      return;
    }
    const baseDate = dates.length ? dates[dates.length - 1] : isoDate(new Date());
    const newDate = nextISODate(baseDate);
    setDates((prev) => {
      const next = [...new Set([...prev, newDate])].sort();
      setCurrentDateIndex(next.indexOf(newDate));
      return next;
    });
    await ensureDateCreatedWithCarry(baseDate, newDate);
  }

  async function handleManualDateChange(e) {
    const selected = e.target.value;
    if (!selected) return;
    
    let updatedDates = [...dates];
    const exists = dates.includes(selected);
    
    if (!exists) {
        updatedDates = [...dates, selected].sort();
        setDates(updatedDates);
    }
    
    const idx = updatedDates.indexOf(selected);
    
    const prevDateIndex = idx - 1 >= 0 ? idx - 1 : null;
    const prevDate = prevDateIndex !== null ? updatedDates[prevDateIndex] : null;

    await ensureDateCreatedWithCarry(prevDate, selected);
    
    setCurrentDateIndex(idx);
  }

  async function selectDate(idx) {
    if (idx < 0 || idx >= dates.length) return;
    const target = dates[idx];
    
    if (!ledgerByDate[target] || !ledgerByDate[target].length) {
      const prevDateIndex = idx - 1 >= 0 ? idx - 1 : null;
      const prevDate = prevDateIndex !== null ? dates[prevDateIndex] : null;
      await ensureDateCreatedWithCarry(prevDate, target);
    }
    setCurrentDateIndex(idx);
  }

  return (
    <div className="ledger-root">

      <LedgerTable
        derivedRows={derivedRows}
        cashAccounts={cashAccounts}
        currentDate={currentDate}
        setCellValue={setCellValue}
        setCashValue={setCashValue}
        addRow={addRow}
        cashTotals={cashTotals}
        totals={totals}
        debtorsInRes={debtorsInRes}
        inputRefs={inputRefs}
        onSaveRow={saveRow}
      />

      <LedgerControls
        dates={dates}
        visibleDates={visibleDates}
        visibleStartIndex={visibleStartIndex}
        currentDateIndex={currentDateIndex}
        prevDate={prevDate}
        nextDate={nextDate}
        selectDate={selectDate}
        addNewDateAuto={addNewDateAuto}
        addNewDateAutoBackward={addNewDateAutoBackward}
        resetViewToLatestDate={resetViewToLatestDate} 
        handleManualDateChange={handleManualDateChange}
        addRow={addRow}
        saveAll={saveAll}
        savingAll={savingAll}
      />

    </div>
  );
}