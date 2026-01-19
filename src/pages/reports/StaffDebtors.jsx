import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api/api';
import '../../styles/StaffDebtors.css';

const formatMoney = (val) => {
    if (typeof val !== 'number') return '-';
    return `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StaffDebtors = () => {
    // 1. Manage the Date for the Report
    const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
    const [rawInvoices, setRawInvoices] = useState([]);
    const [rawLines, setRawLines] = useState([]);
    const [loading, setLoading] = useState(false);

    // 2. Fetch real data from your StaffInvoice backend
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, linesRes] = await Promise.all([
                api.get("/staff-invoice/invoices/"),
                api.get("/staff-invoice/lines/")
            ]);
            setRawInvoices(invRes.data);
            setRawLines(linesRes.data);
        } catch (err) {
            console.error("Failed to load staff records:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 3. Navigation Logic (Next / Prev Day)
    const handleNavigate = (days) => {
        const d = new Date(reportDate);
        d.setDate(d.getDate() + days);
        setReportDate(d.toISOString().split("T")[0]);
    };

    // 4. THE CALCULATION ENGINE (Dynamic grouping by Staff Name)
    const { processedData, totals } = useMemo(() => {
        const startOfMonth = new Date(reportDate);
        startOfMonth.setDate(1);
        const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

        let d_sales_t = 0;
        let d_disc_t = 0;
        let d_total_t = 0;
        let m_sales_t = 0;

        // Group by Name: Only show staff who actually have invoices in the system
        const staffMap = {};

        rawInvoices.forEach(inv => {
            const name = inv.staff_name;
            if (!staffMap[name]) {
                staffMap[name] = { name, d_sales: 0, d_disc: 0, m_sales: 0 };
            }

            // Find all lines belonging to this specific invoice
            const invoiceLines = rawLines.filter(line => line.invoice === inv.id);

            invoiceLines.forEach(line => {
                const amt = parseFloat(line.amount || 0);

                // Daily Sales Logic
                if (line.date === reportDate) {
                    staffMap[name].d_sales += amt;
                }

                // Month to Date Logic (From 1st of month to currently viewed date)
                if (line.date >= startOfMonthStr && line.date <= reportDate) {
                    staffMap[name].m_sales += amt;
                }
            });
        });

        const processed = Object.values(staffMap).map(row => {
            const rowTotal = row.d_sales - row.d_disc;
            
            // Accumulate Grand Totals for Footer
            d_sales_t += row.d_sales;
            d_disc_t += row.d_disc;
            d_total_t += rowTotal;
            m_sales_t += row.m_sales;

            return { ...row, d_total: rowTotal };
        });

        return {
            processedData: processed,
            totals: { d_sales: d_sales_t, d_disc: d_disc_t, d_total: d_total_t, m_sales: m_sales_t }
        };
    }, [rawInvoices, rawLines, reportDate]);

    return (
        <div className="debtors-container">
            <header className="debtors-header">
                <div className="header-info">
                    <h3>Staff Debtors Report</h3>
                    <span className="date-tag">{reportDate}</span>
                </div>

                {/* --- NAVIGATION BUTTONS --- */}
                <div className="report-controls">
                    <button className="nav-btn" onClick={() => handleNavigate(-1)}>◀ Previous Date</button>
                    <button className="nav-btn" onClick={() => handleNavigate(1)}>Next Date ▶</button>
                    <button className="refresh-btn" onClick={fetchData}>↻ Refresh</button>
                </div>
            </header>

            <div className="table-responsive">
                <table className="debtors-table">
                    <thead>
                        <tr>
                            <th rowSpan="2" className="text-left">Name</th>
                            <th colSpan="3" className="group-head">{reportDate} (Actual)</th>
                            <th className="group-head">Month To Date</th>
                        </tr>
                        <tr className="sub-head">
                            <th>Sales Actual</th>
                            <th>Discount Amt</th>
                            <th>Total</th>
                            <th>Sales Actual</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="status-cell">Updating report records...</td></tr>
                        ) : processedData.length > 0 ? (
                            processedData.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="text-left name-col">{row.name}</td>
                                    <td className="numeric">{row.d_sales === 0 ? '-' : formatMoney(row.d_sales)}</td>
                                    <td className="numeric">{row.d_disc === 0 ? '-' : formatMoney(row.d_disc)}</td>
                                    <td className="numeric bold-col">{row.d_total === 0 ? '-' : formatMoney(row.d_total)}</td>
                                    <td className="numeric">{formatMoney(row.m_sales)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="status-cell">No transactions found for this date.</td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr className="grand-total">
                            <td className="text-left">TOTAL</td>
                            <td className="numeric">{formatMoney(totals.d_sales)}</td>
                            <td className="numeric">{formatMoney(totals.d_disc)}</td>
                            <td className="numeric">{formatMoney(totals.d_total)}</td>
                            <td className="numeric highlight">{formatMoney(totals.m_sales)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default StaffDebtors;