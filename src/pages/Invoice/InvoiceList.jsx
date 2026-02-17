import React, { useEffect, useState } from "react";
import api from "../../api/api"; 
import { useNavigate } from "react-router-dom";
import "./InvoiceList.css"; 

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
        return dateString;
    }
};

const InvoiceList = ({ refreshTrigger = 0, onEdit }) => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ FIXED: Changed from sessionStorage to localStorage to match Login.js
    const access = localStorage.getItem("access");
    
    // ✅ IMPROVED: Define base URL dynamically from your api instance if possible, 
    // or use a dedicated environment variable.
    const BASE_API_URL = api.defaults.baseURL || `${window.location.origin}/api/v1`; 

    const fetchInvoices = async () => {
        setLoading(true);
        setError(null);
        
        if (!access) {
            navigate("/login");
            return;
        }

        try {
            // 1. Fetch Guest and Staff Invoices in parallel
            const [guestData, staffData] = await Promise.all([
                api.get("/invoice/invoices/"),
                api.get("/staff-invoice/invoices/")
            ]);
            
            // 2. Normalize Guest Invoices
            const guestInvoices = (guestData.data || []).map(inv => ({
                ...inv,
                type: 'Guest',
                invoice_number: inv.invoice_number,
                name: inv.name || inv.company_account_no, 
                roomNo: inv.room_no || 'N/A',
                arrival: formatDate(inv.arrival_date),
                departure: formatDate(inv.departure_date),
                created_at: inv.created_at || new Date().toISOString(),
            }));

            // 3. Normalize Staff Invoices
            const staffInvoices = (staffData.data || []).map(inv => ({
                ...inv,
                type: 'Staff',
                invoice_number: inv.invoice_number,
                name: inv.staff_name || 'Staff Account',
                roomNo: 'Staff',
                arrival: 'N/A',
                departure: 'N/A',
                created_at: inv.created_at,
            }));

            // 4. Combine and Sort (Latest first)
            const combinedInvoices = [...guestInvoices, ...staffInvoices]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            setInvoices(combinedInvoices);

        } catch (err) {
            console.error("Failed to fetch invoices:", err.response?.data || err.message);
            setError("Failed to load invoice data. Check API status.");
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [refreshTrigger, access]); // Added access to dependency to re-fetch if token changes

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
                                const apiPath = inv.type === 'Staff' ? 'staff-invoice' : 'invoice';

                                return (
                                    <tr
                                        key={`${inv.type}-${inv.id}`}
                                        className={`clickable-row ${inv.type.toLowerCase()}-row`}
                                    >
                                        <td className={`type-tag type-${inv.type.toLowerCase()}`}>{inv.type}</td>
                                        <td className="highlight-text">{inv.invoice_number}</td>
                                        <td>{inv.name}</td>
                                        <td><span className="room-badge">{inv.roomNo}</span></td>
                                        <td>{inv.arrival}</td>
                                        <td>{inv.departure}</td>
                                        <td>{inv.receptionist}</td>
                                        
                                        <td className="action-col">
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