import React, { useEffect, useState } from "react";
// 🚀 Importing the centralized API handler
import api from "../../api/api"; 
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import "./InvoiceList.css"; 

// --- Helper: Format Dates ---
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        // Use Date object for consistent formatting, then strip time for YYYY-MM-DD
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
        return dateString;
    }
};

// 🔹 ACCEPT 'onEdit' PROP FROM PARENT
const InvoiceList = ({ refreshTrigger = 0, onEdit }) => {
    const navigate = useNavigate();
    // Use an array to store combined invoices
    const [invoices, setInvoices] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🛑 Retrieve tokens from sessionStorage
    const access = sessionStorage.getItem("access");
    
    // --- Helper: Get Base URL for PDF Links ---
    // Use window.location.origin as a fallback if BASE_URL is not reliable
    const BASE_API_URL = `${window.location.origin}/api/v1`; 

    // --- Fetch ALL invoices from API ---
    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        
        if (!access) {
            navigate("/login");
            return;
        }

        try {
            // 1. Fetch Guest Invoices
            const guestRes = api.get("/invoice/invoices/");

            // 2. Fetch Staff Invoices
            const staffRes = api.get("/staff-invoice/invoices/");

            // Wait for both promises to resolve
            const [guestData, staffData] = await Promise.all([guestRes, staffRes]);
            
            // 3. Normalize Guest Invoices
            const guestInvoices = (guestData.data || []).map(inv => ({
                ...inv,
                type: 'Guest',
                // Map API fields to common display fields
                invoice_number: inv.invoice_number,
                name: inv.name || inv.company_account_no, 
                roomNo: inv.room_no || 'N/A',
                arrival: formatDate(inv.arrival_date),
                departure: formatDate(inv.departure_date),
                created_at: inv.created_at || new Date().toISOString(), // Fallback for sorting
            }));

            // 4. Normalize Staff Invoices
            const staffInvoices = (staffData.data || []).map(inv => ({
                ...inv,
                type: 'Staff',
                // Map staff-specific fields to common display fields
                invoice_number: inv.invoice_number,
                name: inv.staff_name || 'Staff Account', // Use staff_name
                roomNo: 'Staff', // Specific label for display
                arrival: 'N/A', // Staff invoices don't have this
                departure: 'N/A', // Staff invoices don't have this
                created_at: inv.created_at, // Use created_at for sorting
            }));

            // 5. Combine, Sort (Latest first), and Limit (Optional: slice(0, 20))
            const combinedInvoices = [...guestInvoices, ...staffInvoices]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                // If you want to limit to 20 recent, add .slice(0, 20) here
            
            setInvoices(combinedInvoices);

        } catch (err) {
            console.error("Failed to fetch invoices:", err.response?.data || err.message);
            setError("Failed to load invoice data. Check API status.");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Load invoices on mount or refresh trigger ---
    useEffect(() => {
        fetchInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    // --- UI ---
    if (loading) return <p className="loading-text">Loading invoices...</p>;
    if (error) return <p className="error-text">Error: {error}</p>;

    return (
        <div className="invoice-list-container">
            <div className="list-header">
                <h2>Recent Invoices</h2>
            </div>
            
            {invoices.length === 0 ? (
                <div className="empty-state">
                    <p>No invoices found.</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="invoice-list-table">
                        <thead>
                            <tr>
                                {/* 🌟 New Column: Type */}
                                <th style={{width: '8%'}}>Type</th> 
                                <th style={{width: '10%'}}>Invoice No</th>
                                <th style={{width: '25%'}}>Name / Account</th>
                                <th style={{width: '8%'}}>Room No</th>
                                <th style={{width: '12%'}}>Arrival</th>
                                <th style={{width: '12%'}}>Departure</th>
                                <th style={{width: '10%'}}>Receptionist</th>
                                <th className="action-col" style={{width: '15%'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map((inv) => {
                                // Determine the base API path for PDF/Detail links
                                const apiPath = inv.type === 'Staff' ? 'staff-invoice' : 'invoice';

                                return (
                                    <tr
                                        key={`${inv.type}-${inv.id}`}
                                        className={`clickable-row ${inv.type.toLowerCase()}-row`}
                                        // Optional: Navigate to a detailed view if you have one
                                        // onClick={() => navigate(`/${apiPath}/${inv.id}`)}
                                    >
                                        {/* 🌟 Type Column */}
                                        <td className={`type-tag type-${inv.type.toLowerCase()}`}>{inv.type}</td>
                                        
                                        <td className="highlight-text">{inv.invoice_number}</td>
                                        <td>{inv.name}</td>
                                        <td><span className="room-badge">{inv.roomNo}</span></td>
                                        <td>{inv.arrival}</td>
                                        <td>{inv.departure}</td>
                                        <td>{inv.receptionist}</td>
                                        
                                        <td className="action-col">
                                            {/* 🔹 EDIT BUTTON (Only for Guest Invoices) */}
                                            {inv.type === 'Guest' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onEdit(inv); }}
                                                    style={{
                                                        marginRight: '8px', 
                                                        background: 'transparent', 
                                                        border: '1px solid #ffb547', 
                                                        color: '#ffb547', 
                                                        cursor: 'pointer', 
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            
                                            {/* 🔹 PDF Link (Uses correct API path based on type) */}
                                            <a
                                                href={`${BASE_API_URL}/${apiPath}/invoices/${inv.id}/pdf/`}
                                                onClick={(e) => e.stopPropagation()}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="pdf-link"
                                            >
                                                PDF
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;