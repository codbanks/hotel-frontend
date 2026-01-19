import React, { useState, useEffect } from "react";
// 🚀 Importing the centralized API handler
import api from "../../api/api"; 
import { useNavigate } from "react-router-dom";
import "./Invoice.css"; 
import InvoiceList from "./InvoiceList";
// 🔹 IMPORT NEW COMPONENT (We assume StaffInvoice.jsx exists)
import StaffInvoiceDetail from "./StaffInvoice"; // Renamed to avoid confusion

const Invoice = () => {
    const navigate = useNavigate();

    // 🔹 STATE: Initial Blank Invoice (Guest)
    const initialInvoiceState = {
        name: "", address: "", arrivalDate: "", departureDate: "", roomNo: "", roomType: "",
        adults: 1, children: 0, rateAllocated: "", companyAccount: "", 
        receptionist: "", 
        vatNumber: "10005237", invoiceNo: "",
    };

    const [invoiceData, setInvoiceData] = useState(initialInvoiceState);
    const [lines, setLines] = useState([{ date: "", description: "", voucher: "", charges: 0, credits: 0 }]);
    
    // 🔹 STATE: UI Controls
    const [showGuestModal, setShowGuestModal] = useState(false); // Renamed for clarity
    const [showStaffModal, setShowStaffModal] = useState(false); 
    const [isEditing, setIsEditing] = useState(false); 
    const [editingId, setEditingId] = useState(null);  
    const [refreshListTrigger, setRefreshListTrigger] = useState(0); 

    const access = sessionStorage.getItem("access"); 
    const isLoggedIn = !!access;

    useEffect(() => {
        if (!isLoggedIn) navigate("/login");
    }, [isLoggedIn, navigate]);

    // --- HELPER: Get Current Logged In User ---
    const getReceptionistName = () => {
        try {
            const userPayload = sessionStorage.getItem("user_payload");
            if (userPayload) {
                const user = JSON.parse(userPayload);
                return user.first_name || user.username || "Reception"; 
            }
        } catch (e) {
            console.error("Error parsing user payload", e);
        }
        return "Reception";
    };

    // --- HANDLER: New Guest Invoice ---
    const handleNewGuestInvoice = () => {
        setIsEditing(false);
        setEditingId(null);
        setInvoiceData({ ...initialInvoiceState, receptionist: getReceptionistName() });
        setLines([{ date: "", description: "", voucher: "", charges: 0, credits: 0 }]);
        setShowGuestModal(true);
    };

    // 🌟 --- HANDLER: New Staff Invoice (Dedicated for Staff modal) ---
    const handleNewStaffInvoice = () => {
        // No need to set complex state here, as StaffInvoiceDetail will manage its own.
        setShowStaffModal(true);
    };

    // --- HANDLER: Edit Guest Invoice ---
    const handleEditInvoice = async (invoice) => {
        // SECURITY CHECK: Ensure we only attempt to edit Guest invoices via this path
        if (invoice.type !== 'Guest') {
            alert(`Cannot edit ${invoice.type} invoice here. Use the appropriate workflow or log into the admin panel.`);
            return;
        }

        setIsEditing(true);
        setEditingId(invoice.id);
        
        setInvoiceData({
            name: invoice.name,
            address: invoice.address,
            arrivalDate: invoice.arrival_date,
            departureDate: invoice.departure_date,
            roomNo: invoice.room_no,
            roomType: invoice.room_type,
            adults: invoice.adults,
            children: invoice.children,
            rateAllocated: invoice.rate_allocated,
            companyAccount: invoice.company_account_no,
            receptionist: getReceptionistName(), // Log the person making the EDIT
            vatNumber: invoice.vat_number,
            invoiceNo: invoice.invoice_number,
        });

        try {
            // Fetch lines for the Guest Invoice
            const res = await api.get(`/invoice/invoicelines/?invoice=${invoice.id}`);
            setLines(res.data); 
        } catch (err) {
            console.error("Failed to fetch lines", err);
            setLines([{ date: "", description: "", voucher: "", charges: 0, credits: 0 }]);
        }

        setShowGuestModal(true);
    };

    const handleChange = (e) => setInvoiceData({ ...invoiceData, [e.target.name]: e.target.value });

    const handleLineChange = (index, field, value) => {
        // SECURITY CHECK: If this line has an ID, it is historical. Do not allow edits.
        if (lines[index].id) return;

        const newLines = [...lines];
        newLines[index][field] = value;
        setLines(newLines);
    };

    const addRow = () => {
        const today = new Date().toISOString().split('T')[0];
        // New lines do NOT have an 'id', so they will be editable
        setLines([...lines, { date: today, description: "", voucher: "", charges: 0, credits: 0 }]);
    };

    const removeRow = (index) => {
        // SECURITY CHECK: Do not allow removing saved lines
        if (lines[index].id) {
            alert("You cannot remove past transactions.");
            return;
        }
        setLines(lines.filter((_, idx) => idx !== index));
    };

    const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.charges) || 0) - (parseFloat(l.credits) || 0), 0);
    const vat = subtotal * 0.15;
    const total = subtotal + vat;

    // --- SUBMIT LOGIC (Guest Invoice) ---
    const handleSubmit = async () => {
        if (!window.confirm(isEditing ? "Confirm update? Past data is locked." : "Create this invoice?")) return;

        try {
            const invoicePayload = {
                name: invoiceData.name,
                address: invoiceData.address,
                arrival_date: invoiceData.arrivalDate,
                departure_date: invoiceData.departureDate,
                room_no: invoiceData.roomNo,
                room_type: invoiceData.roomType,
                adults: invoiceData.adults,
                children: invoiceData.children,
                rate_allocated: invoiceData.rateAllocated,
                company_account_no: invoiceData.companyAccount,
                receptionist: invoiceData.receptionist,
                vat_number: invoiceData.vatNumber,
                invoice_number: invoiceData.invoiceNo,
            };

            let activeInvoiceId = editingId;

            if (isEditing) {
                // In Edit mode, we PATCH (Update) the invoice header (mainly for Departure Date)
                await api.patch(`/invoice/invoices/${editingId}/`, invoicePayload);
            } else {
                const res = await api.post("/invoice/invoices/", invoicePayload);
                activeInvoiceId = res.data.id;
            }

            // Handle Lines
            await Promise.all(
                lines.map((l) => {
                    // IF line has ID, it's old. We SKIP it to prevent tampering.
                    if (l.id) return Promise.resolve(); 

                    // IF line has NO ID, it is new. CREATE it.
                    return api.post("/invoice/invoicelines/", {
                        invoice: activeInvoiceId,
                        date: l.date,
                        description: l.description,
                        voucher: l.voucher,
                        charges: l.charges,
                        credits: l.credits,
                    });
                })
            );

            setRefreshListTrigger((s) => s + 1);
            setShowGuestModal(false); // Close Guest Modal
            alert("Saved Successfully!");

        } catch (err) {
            console.error("Error:", err.response?.data || err.message);
            alert("Error saving invoice.");
        }
    };

    // Helper style for locked fields
    const lockedStyle = { backgroundColor: '#1a2230', color: '#666', border: '1px solid #333', cursor: 'not-allowed' };

    return (
        <div className="invoice-page">
            
            {/* 🔹 MAIN LIST VIEW (Hidden if ANY modal is open) */}
            {!showGuestModal && !showStaffModal && (
                <>
                    {/* BUTTON CONTAINER */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <button className="new-invoice-btn" onClick={handleNewGuestInvoice}>
                            + New Guest Invoice
                        </button>
                        
                        {/* NEW STAFF BUTTON (Now calls dedicated handler) */}
                        <button 
                            className="new-invoice-btn" 
                            style={{ backgroundColor: "#47b5ff", color: "#000", fontWeight: 'bold' }} 
                            onClick={handleNewStaffInvoice} // 🌟 UPDATED HANDLER
                        >
                            + New Staff Invoice
                        </button>
                    </div>

                    <InvoiceList refreshTrigger={refreshListTrigger} onEdit={handleEditInvoice} />
                </>
            )}

            {/* 🔹 GUEST INVOICE MODAL (showModal renamed to showGuestModal) */}
            {showGuestModal && (
                <div className="fullscreen-modal glass-bg">
                    <button className="back-floating-center" onClick={() => setShowGuestModal(false)}>← Cancel & Close</button>
                    <div className="modal-fixed">
                        <div className="modal-content-fixed">
                            
                            <header className="invoice-header">
                                <div className="header-brand">
                                    <h1>The Pumpkin Hotel (Pvt) Ltd</h1>
                                    <p style={{color: isEditing ? '#ffb547' : '#888'}}>
                                        {isEditing ? "EDIT MODE (Restricted)" : "NEW GUEST INVOICE"}
                                    </p>
                                </div>
                                <div className="invoice-meta">
                                    <label>TAX INVOICE No:</label>
                                    <input className="invoiceNo" value={invoiceData.invoiceNo} onChange={handleChange} name="invoiceNo" readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                </div>
                            </header>

                            {/* Guest Details - LOCKED ON EDIT */}
                            <section className="input-grid-section">
                                <h3>Guest Details</h3>
                                <div className="guest-info">
                                    <div className="input-group full-width">
                                        <label>Name</label>
                                        <input name="name" value={invoiceData.name} onChange={handleChange} readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Address</label>
                                        <input name="address" value={invoiceData.address} onChange={handleChange} readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                    </div>
                                </div>
                            </section>

                            {/* Stay Details */}
                            <section className="input-grid-section">
                                <h3>Stay Details</h3>
                                <div className="stay-info">
                                    <div className="input-group">
                                        <label>Arrival Date</label>
                                        <input name="arrivalDate" type="date" value={invoiceData.arrivalDate} onChange={handleChange} readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                    </div>
                                    
                                    {/* 👇 DEPARTURE DATE: Always Editable */}
                                    <div className="input-group" style={{border: '1px solid #ffb547', borderRadius: '4px'}}>
                                        <label style={{color: '#ffb547'}}>Departure Date</label>
                                        <input name="departureDate" type="date" value={invoiceData.departureDate} onChange={handleChange} />
                                    </div>

                                    <div className="input-group">
                                        <label>Room No</label>
                                        <input name="roomNo" value={invoiceData.roomNo} onChange={handleChange} readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                    </div>
                                    <div className="input-group">
                                        <label>Room Type</label>
                                        <input name="roomType" value={invoiceData.roomType} onChange={handleChange} readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                    </div>
                                    <div className="input-group">
                                        <label>Adults</label>
                                        <input name="adults" type="number" value={invoiceData.adults} onChange={handleChange} readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                    </div>
                                    <div className="input-group">
                                        <label>Rate Allocated</label>
                                        <input name="rateAllocated" value={invoiceData.rateAllocated} onChange={handleChange} readOnly={isEditing} style={isEditing ? lockedStyle : {}} />
                                    </div>
                                    <div className="input-group">
                                        <label>Receptionist</label>
                                        <input name="receptionist" value={invoiceData.receptionist} readOnly style={lockedStyle} />
                                    </div>
                                </div>
                            </section>

                            {/* Line Items */}
                            <div className="table-responsive">
                                <table className="invoice-table">
                                    <thead>
                                        <tr>
                                            <th style={{width: '15%'}}>Date</th>
                                            <th style={{width: '35%'}}>Description</th>
                                            <th style={{width: '15%'}}>Voucher</th>
                                            <th style={{width: '15%'}}>Charges ($)</th>
                                            <th style={{width: '15%'}}>Credits ($)</th>
                                            <th style={{width: '5%'}}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((l, i) => {
                                            const isLocked = !!l.id; 
                                            const rowStyle = isLocked ? { backgroundColor: '#1a2230', color: '#666' } : {};

                                            return (
                                                <tr key={i} style={rowStyle}>
                                                    <td>
                                                        <input type="date" value={l.date} onChange={(e) => handleLineChange(i, "date", e.target.value)} readOnly={isLocked} style={isLocked ? {border:'none', background:'transparent', color:'#888'} : {}} />
                                                    </td>
                                                    <td>
                                                        <input type="text" value={l.description} onChange={(e) => handleLineChange(i, "description", e.target.value)} readOnly={isLocked} style={isLocked ? {border:'none', background:'transparent', color:'#888'} : {}} placeholder={isLocked ? "" : "Description"} />
                                                    </td>
                                                    <td>
                                                        <input type="text" value={l.voucher} onChange={(e) => handleLineChange(i, "voucher", e.target.value)} readOnly={isLocked} style={isLocked ? {border:'none', background:'transparent', color:'#888'} : {}} />
                                                    </td>
                                                    <td>
                                                        <input type="number" value={l.charges} onChange={(e) => handleLineChange(i, "charges", e.target.value)} readOnly={isLocked} style={isLocked ? {border:'none', background:'transparent', color:'#888'} : {}} />
                                                    </td>
                                                    <td>
                                                        <input type="number" value={l.credits} onChange={(e) => handleLineChange(i, "credits", e.target.value)} readOnly={isLocked} style={isLocked ? {border:'none', background:'transparent', color:'#888'} : {}} />
                                                    </td>
                                                    <td>
                                                        {!isLocked && <button className="row-remove" onClick={() => removeRow(i)}>×</button>}
                                                        {isLocked && <span style={{fontSize:'12px'}}>🔒</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <button onClick={addRow} className="add-row">+ Add Line Item</button>

                            <div className="footer-layout">
                                <div className="actions-left">
                                    <button className="cancel-btn" onClick={() => setShowGuestModal(false)}>Cancel</button>
                                    <button className="save-btn" onClick={handleSubmit}>
                                        {isEditing ? "Update Invoice" : "Save Invoice"}
                                    </button>
                                </div>
                                <div className="totals">
                                    <div className="totals-row"><span>Sub Total:</span> <span>${subtotal.toFixed(2)}</span></div>
                                    <div className="totals-row"><span>VAT (15%):</span> <span>${vat.toFixed(2)}</span></div>
                                    <div className="totals-row grand-total"><span>Total:</span> <span>${total.toFixed(2)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔹 NEW STAFF INVOICE MODAL */}
            {showStaffModal && (
                <StaffInvoiceDetail // 🌟 Renamed component for clarity
                    onClose={() => setShowStaffModal(false)}
                    onSuccess={() => {
                        // Close modal, and trigger list refresh
                        setShowStaffModal(false);
                        setRefreshListTrigger(s => s + 1); 
                        alert("Staff Invoice Created Successfully!");
                    }}
                />
            )}

        </div>
    );
};

export default Invoice;