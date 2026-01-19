import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/CustomerSegmentation.css';

// --- UTILITY FUNCTIONS ---
const formatCurrency = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    // Returns $ 1,234.00
    return `$ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return '0';
    return val.toLocaleString('en-US');
};

const calculateRate = (revenue, rooms) => {
    if (!rooms || rooms === 0) return 0;
    return revenue / rooms;
};

const calculatePercent = (val, total) => {
    if (!total || total === 0) return 0;
    return (val / total) * 100;
};

// --- MOCK DATA SOURCE (Replace with Backend Fetch) ---
const fetchCustomerData = () => {
    // Structure: Raw numbers only. The component calculates rates & %
    return [
        { id: 1, name: 'MLAMBO', d_bn: 1, d_rn: 1, d_rev: 0, m_bn: 1, m_rn: 1, m_rev: 80.00 },
        { id: 2, name: 'PELUM-ZWE', d_bn: 93, d_rn: 93, d_rev: 1550.00, m_bn: 93, m_rn: 93, m_rev: 1550.00 },
        { id: 3, name: 'NDOMERA', d_bn: 3, d_rn: 2, d_rev: 100.00, m_bn: 3, m_rn: 2, m_rev: 100.00 },
        { id: 4, name: 'SALIWE', d_bn: 1, d_rn: 1, d_rev: 30.00, m_bn: 1, m_rn: 1, m_rev: 30.00 },
        { id: 5, name: 'TAFADZWA', d_bn: 2, d_rn: 1, d_rev: 30.00, m_bn: 2, m_rn: 1, m_rev: 30.00 },
        { id: 6, name: 'AFRICAN GAS', d_bn: 8, d_rn: 7, d_rev: 285.00, m_bn: 8, m_rn: 7, m_rev: 285.00 },
        { id: 7, name: 'CAMFED', d_bn: 2, d_rn: 2, d_rev: 80.00, m_bn: 2, m_rn: 2, m_rev: 80.00 },
        { id: 8, name: 'MUGANHURI', d_bn: 1, d_rn: 1, d_rev: 30.00, m_bn: 1, m_rn: 1, m_rev: 30.00 },
        { id: 9, name: 'HQ 2 INFANTRY BRIGADE', d_bn: 2, d_rn: 2, d_rev: 240.00, m_bn: 2, m_rn: 2, m_rev: 240.00 },
        { id: 10, name: 'CHIVIRI', d_bn: 1, d_rn: 1, d_rev: 80.00, m_bn: 1, m_rn: 1, m_rev: 80.00 },
        { id: 11, name: 'TRANSIT', d_bn: 4, d_rn: 3, d_rev: 90.00, m_bn: 4, m_rn: 3, m_rev: 90.00 },
        { id: 12, name: 'EMA', d_bn: 6, d_rn: 6, d_rev: 150.00, m_bn: 6, m_rn: 6, m_rev: 150.00 },
        { id: 13, name: 'INSTA TOLL', d_bn: 4, d_rn: 4, d_rev: 240.00, m_bn: 4, m_rn: 4, m_rev: 240.00 },
    ];
};

const CustomerSegmentation = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        setData(fetchCustomerData());
    }, []);

    // --- CALCULATION ENGINE ---
    const totals = useMemo(() => {
        return data.reduce((acc, row) => ({
            d_bn: acc.d_bn + row.d_bn,
            d_rn: acc.d_rn + row.d_rn,
            d_rev: acc.d_rev + row.d_rev,
            m_bn: acc.m_bn + row.m_bn,
            m_rn: acc.m_rn + row.m_rn,
            m_rev: acc.m_rev + row.m_rev,
        }), { d_bn: 0, d_rn: 0, d_rev: 0, m_bn: 0, m_rn: 0, m_rev: 0 });
    }, [data]);

    const d_avgRateTotal = calculateRate(totals.d_rev, totals.d_rn);
    const m_avgRateTotal = calculateRate(totals.m_rev, totals.m_rn);

    return (
        <div className="report-container">
            <header className="report-header">
                <h2>Customer Segmentation</h2>
                <span className="date-badge">15-Jul-25</span>
            </header>

            <div className="table-wrapper">
                <table className="segmentation-table">
                    <thead>
                        <tr>
                            <th className="sticky-col">Customer</th>
                            <th colSpan="6" className="group-header">15-Jul-25 (Actual)</th>
                            <th colSpan="6" className="group-header">Month To Date</th>
                        </tr>
                        <tr className="sub-header">
                            <th className="sticky-col">Name</th>
                            {/* Day Columns */}
                            <th>Bed Nights</th><th>% Contr</th>
                            <th>Room Nights</th><th>% Cont</th>
                            <th>Revenue</th><th>Ave Rm Rate</th>
                            {/* MTD Columns */}
                            <th>Bed Nights</th><th>% Contr</th>
                            <th>Room Nights</th><th>% Cont</th>
                            <th>Revenue</th><th>Ave Rm Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr key={row.id}>
                                <td className="text-left sticky-col">{row.name}</td>
                                
                                {/* DAY DATA */}
                                <td>{formatNumber(row.d_bn)}</td>
                                <td>{calculatePercent(row.d_bn, totals.d_bn).toFixed(2)}</td>
                                <td>{formatNumber(row.d_rn)}</td>
                                <td>{calculatePercent(row.d_rn, totals.d_rn).toFixed(2)}</td>
                                <td className="currency">{formatCurrency(row.d_rev)}</td>
                                <td className="currency">{formatCurrency(calculateRate(row.d_rev, row.d_rn))}</td>

                                {/* MTD DATA */}
                                <td>{formatNumber(row.m_bn)}</td>
                                <td>{calculatePercent(row.m_bn, totals.m_bn).toFixed(2)}</td>
                                <td>{formatNumber(row.m_rn)}</td>
                                <td>{calculatePercent(row.m_rn, totals.m_rn).toFixed(2)}</td>
                                <td className="currency">{formatCurrency(row.m_rev)}</td>
                                <td className="currency">{formatCurrency(calculateRate(row.m_rev, row.m_rn))}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td className="sticky-col">TOTAL</td>
                            <td>{formatNumber(totals.d_bn)}</td>
                            <td>100.00</td>
                            <td>{formatNumber(totals.d_rn)}</td>
                            <td>100.00</td>
                            <td className="currency">{formatCurrency(totals.d_rev)}</td>
                            <td className="currency">{formatCurrency(d_avgRateTotal)}</td>
                            
                            <td>{formatNumber(totals.m_bn)}</td>
                            <td>100.00</td>
                            <td>{formatNumber(totals.m_rn)}</td>
                            <td>100.00</td>
                            <td className="currency">{formatCurrency(totals.m_rev)}</td>
                            <td className="currency">{formatCurrency(m_avgRateTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default CustomerSegmentation;