import React, { useEffect, useState, useRef } from "react";
import api from "../services/api";
import "../styles/HouseStatusReport.css";

// -------------------------
// Static fallback rooms
// -------------------------
const STATIC_ROOMS = Array.from({ length: 58 }, (_, i) => {
  const typeMap = {
    1: "Double", 2: "Double", 3: "Double", 4: "Twin", 5: "Twin",
    6: "Twin", 7: "Twin", 8: "Twin", 9: "Twin", 10: "Twin",
    11: "Twin", 12: "Twin", 13: "Twin", 14: "Twin", 15: "Twin",
    16: "Twin", 17: "Twin", 18: "Twin", 19: "Twin", 20: "Twin",
    21: "Twin", 22: "Twin", 23: "Twin", 24: "Twin", 25: "Double",
    26: "Double", 27: "Twin", 28: "Twin", 29: "Twin", 30: "Double",
    31: "Twin", 32: "Twin", 33: "Twin", 34: "Twin", 35: "Double",
    36: "Double", 37: "Twin", 38: "Twin", 39: "Suite", 40: "Suite",
    41: "Double", 42: "Double", 43: "Double", 44: "Double", 45: "Double",
    46: "Double", 47: "Double", 48: "Twin", 49: "Double", 50: "Double",
    51: "Single", 52: "Single", 53: "Single", 54: "Twin", 55: "Twin",
    56: "Twin", 57: "Twin", 58: "Single",
  };
  return {
    room_number: i + 1,
    room_type: typeMap[i + 1],
    guest_name: "",
    pax: "",
    organization: "",
    check_in: "",
    check_out: "",
    requirements: "",
    time: "",
    rate: "",
    out_of_order: false,
  };
});

// -------------------------
// Date helpers
// -------------------------
const isoDate = (d) => new Date(d).toISOString().split("T")[0];
const nextISODate = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return isoDate(d);
};
const prevISODate = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return isoDate(d);
};

// -------------------------
// Main Component
// -------------------------
export default function HouseStatusReport() {
  const todayStr = isoDate(new Date());
  const [date, setDate] = useState(todayStr);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [message, setMessage] = useState(null);
  const [filter, setFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("house-darkmode") === "true");
  const tableRef = useRef(null);

  // -------------------------
  // Fetch data every time the date changes
  // -------------------------
  useEffect(() => {
    fetchData();
  }, [date]);

  // -------------------------
  // Dark mode effect
  // -------------------------
  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "";
    localStorage.setItem("house-darkmode", darkMode);
  }, [darkMode]);

  // -------------------------
  // Fetch bookings from backend
  // -------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings from backend
      const res = await api.get(`/house_status_report/house-status/`);
      const allBookings = res.data;

      // Copy static rooms for full display
      const updatedRows = STATIC_ROOMS.map((room) => ({ ...room }));
      const selectedDateObj = new Date(date);

      // Overlay guest data if room is occupied on selected date
      allBookings.forEach((booking) => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);

        if (selectedDateObj >= checkIn && selectedDateObj <= checkOut) {
          const roomIndex = updatedRows.findIndex(
            (r) => r.room_number === parseInt(booking.room_number)
          );
          if (roomIndex !== -1) {
            updatedRows[roomIndex] = {
              ...updatedRows[roomIndex],
              guest_name: booking.guest_name,
              organization: booking.organization,
              pax: booking.pax,
              check_in: booking.check_in,
              check_out: booking.check_out,
              rate: booking.rate,
              out_of_order: booking.out_of_order,
              time: booking.time,
            };
          }
        }
      });

      setRows(updatedRows);
    } catch (err) {
      console.error("Fetch error:", err);
      setRows(STATIC_ROOMS);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Update a single cell
  // -------------------------
  const handleChange = (idx, field, value) => {
    const updatedRows = [...rows];
    updatedRows[idx][field] = value;
    setRows(updatedRows);
  };

  // -------------------------
  // Save a single row
  // -------------------------
  const handleSave = async (row) => {
    try {
      await api.post(`/house_status_report/house-status/`, { date, ...row });
      setMessage({ type: "success", text: `Room ${row.room_number} saved ✅` });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: `❌ Error saving Room ${row.room_number}` });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // -------------------------
  // Save all rows at once
  // -------------------------
  const handleSaveAll = async () => {
    setSavingAll(true);
    try {
      await api.post(`/house_status_report/house-status/block_save/`, { date, rows });
      setMessage({ type: "success", text: "All rooms saved successfully ✅" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "❌ Error saving all rooms" });
    } finally {
      setSavingAll(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // -------------------------
  // Filter rows for display
  // -------------------------
  const filteredRows = rows.filter((r) => {
    if (filter === "occupied") return r.guest_name.trim() !== "";
    if (filter === "unoccupied") return r.guest_name.trim() === "";
    if (filter === "outoforder") return r.out_of_order;
    return true; // 'all' shows everything
  });

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className={`house-status-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="toolbar top-row">
        <div className="left">
          <h1>🏨 House Status Report</h1>
        </div>
        <div className="right">
          <button onClick={() => setDate(prevISODate(date))}>⬅ Previous Day</button>
          <button onClick={() => setDate(nextISODate(date))}>➡ Next Day</button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? "💾 Saving..." : "💾 Save All"}
          </button>
          <button onClick={() => window.print()}>🖨 Print</button>
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "🌞 Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type === "error" ? "message--err" : "message--ok"}`}>
          {message.text}
        </div>
      )}

      <div className="filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
        <button className={filter === "occupied" ? "active" : ""} onClick={() => setFilter("occupied")}>Occupied</button>
        <button className={filter === "unoccupied" ? "active" : ""} onClick={() => setFilter("unoccupied")}>Vacant</button>
        <button className={filter === "outoforder" ? "active" : ""} onClick={() => setFilter("outoforder")}>Out of Order</button>
      </div>

      <div className="table-wrap" ref={tableRef}>
        <table className="house-status-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Guest Name</th>
              <th>Pax</th>
              <th>Organization</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Requirements</th>
              <th>Time</th>
              <th>Rate</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" style={{ textAlign: "center", padding: "40px" }}>
                  Loading data...
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr key={row.room_number}>
                  <td>{row.room_number}</td>
                  <td>{row.room_type}</td>
                  <td><input value={row.guest_name} onChange={(e) => handleChange(idx, "guest_name", e.target.value)} /></td>
                  <td><input type="number" value={row.pax} onChange={(e) => handleChange(idx, "pax", e.target.value)} /></td>
                  <td><input value={row.organization} onChange={(e) => handleChange(idx, "organization", e.target.value)} /></td>
                  <td><input type="date" value={row.check_in} onChange={(e) => handleChange(idx, "check_in", e.target.value)} /></td>
                  <td><input type="date" value={row.check_out} onChange={(e) => handleChange(idx, "check_out", e.target.value)} /></td>
                  <td><input value={row.requirements} onChange={(e) => handleChange(idx, "requirements", e.target.value)} /></td>
                  <td><input value={row.time} onChange={(e) => handleChange(idx, "time", e.target.value)} /></td>
                  <td><input type="number" step="0.01" value={row.rate} onChange={(e) => handleChange(idx, "rate", e.target.value)} /></td>
                  <td><button onClick={() => handleSave(row)}>💾</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
