import React, { useState } from "react";
import api from "../../api/api";
import "./StaffInvoice.css";

const StaffInvoice = ({ onClose, onSuccess }) => {
  const [header, setHeader] = useState({
    staffName: "",
    staffId: "",
    department: "",
    receptionist: "Reception",
    invoiceNo: "",
  });

  const [lines, setLines] = useState([
    { 
      date: new Date().toISOString().split("T")[0], 
      category: "Food", 
      description: "", 
      amount: 0 
    }
  ]);

  const [loading, setLoading] = useState(false);

  // Maps Invoice categories to the specific fields in LedgerRow model
  const categoryMap = {
    "Food": "food",
    "Bar": "bar",
    "Laundry": "laundry",
    "Pool": "swimming",
    "Room": "room_hire",
    "Other": "other"
  };

  const handleHeaderChange = (e) => {
    setHeader({ ...header, [e.target.name]: e.target.value });
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { 
      date: new Date().toISOString().split("T")[0], 
      category: "Food", 
      description: "", 
      amount: 0 
    }]);
  };

  const removeLine = (index) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const total = lines.reduce((sum, line) => sum + parseFloat(line.amount || 0), 0);

  const handleSubmit = async () => {
    if (!header.staffName) {
      alert("Please fill in the Staff Name");
      return;
    }

    setLoading(true);
    try {
      // 1. Save to Staff Invoice Tables
      const invRes = await api.post("/staff-invoice/invoices/", {
        staff_name: header.staffName,
        staff_id: header.staffId,
        department: header.department,
        receptionist: header.receptionist,
        invoice_number: header.invoiceNo,
      });

      const invoiceId = invRes.data.id;

      // 2. Aggregate category totals & save lines
      const currentInvoiceTotals = {};
      await Promise.all(lines.map(line => {
        const col = categoryMap[line.category] || "other";
        currentInvoiceTotals[col] = (currentInvoiceTotals[col] || 0) + parseFloat(line.amount || 0);

        return api.post("/staff-invoice/lines/", {
          invoice: invoiceId,
          date: line.date,
          category: line.category,
          description: line.description,
          amount: line.amount
        });
      }));

      // 3. SYNC TO LEDGER (Avoid Duplicates)
      const today = new Date().toISOString().split("T")[0];
      const ledgerCheck = await api.get(`/ledger/?guestname=${encodeURIComponent(header.staffName)}&date=${today}`);

      let ledgerPayload = {
        date: today,
        folio: "STAFF",
        guest_name: header.staffName,
        ...currentInvoiceTotals
      };

      if (ledgerCheck.data.length > 0) {
        // UPDATE Existing Row
        const existingRow = ledgerCheck.data[0];
        
        // Add new amounts to existing category amounts
        Object.keys(currentInvoiceTotals).forEach(key => {
          ledgerPayload[key] = parseFloat(existingRow[key] || 0) + currentInvoiceTotals[key];
        });

        const updatePayload = { ...existingRow, ...ledgerPayload };
        await api.put(`/ledger/${existingRow.id}/`, updatePayload);
      } else {
        // CREATE New Row
        await api.post("/ledger/", ledgerPayload);
      }

      alert("Staff Invoice processed and Ledger updated!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Sync Error:", err);
      alert("Error syncing data. Ensure staff name matches ledger exactly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fullscreen-modal glass-bg">
      <div className="staff-modal-content">
        <div className="staff-header">
          <h2>New Staff Invoice</h2>
          <button className="row-remove" style={{ fontSize: '24px' }} onClick={onClose}>×</button>
        </div>

        <div className="staff-input-section">
          <div className="staff-grid">
            <div className="staff-input-group">
              <label>Staff Name (Matches Ledger)</label>
              <input name="staffName" value={header.staffName} onChange={handleHeaderChange} placeholder="e.g. PAUL LUNA" />
            </div>
            <div className="staff-input-group">
              <label>Staff ID</label>
              <input name="staffId" value={header.staffId} onChange={handleHeaderChange} placeholder="ID Number" />
            </div>
            <div className="staff-input-group">
              <label>Department</label>
              <input name="department" value={header.department} onChange={handleHeaderChange} placeholder="e.g. Kitchen" />
            </div>
            <div className="staff-input-group">
              <label>Invoice No</label>
              <input name="invoiceNo" value={header.invoiceNo} onChange={handleHeaderChange} placeholder="INV-001" />
            </div>
            <div className="staff-input-group">
              <label>Receptionist</label>
              <input name="receptionist" value={header.receptionist} onChange={handleHeaderChange} />
            </div>
          </div>
        </div>

        <div className="staff-table-wrapper">
          <table className="staff-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount ($)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i}>
                  <td><input type="date" value={line.date} onChange={(e) => handleLineChange(i, "date", e.target.value)} /></td>
                  <td>
                    <select value={line.category} onChange={(e) => handleLineChange(i, "category", e.target.value)}>
                      {Object.keys(categoryMap).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </td>
                  <td><input value={line.description} onChange={(e) => handleLineChange(i, "description", e.target.value)} /></td>
                  <td><input type="number" value={line.amount} onChange={(e) => handleLineChange(i, "amount", e.target.value)} /></td>
                  <td><button className="row-remove" onClick={() => removeLine(i)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="add-row" onClick={addLine}>+ Add Item</button>
        </div>

        <div className="staff-actions-footer">
          <div className="staff-total">Total: <span>${total.toFixed(2)}</span></div>
          <div>
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="staff-btn-save" onClick={handleSubmit} disabled={loading}>
              {loading ? "Processing..." : "Process Staff Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffInvoice;