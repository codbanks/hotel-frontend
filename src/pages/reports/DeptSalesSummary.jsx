import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/api';
import '../../styles/FinancialSummary.css';

const isoDate = (date) => new Date(date).toISOString().split('T')[0];
const toNumber = (val) => parseFloat(val) || 0;

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$ 0.00';
    const absVal = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount < 0 ? `$ (${absVal})` : `$ ${absVal}`;
};

const formatPercent = (val, total) => {
    if (!total || total === 0) return '0.00';
    return ((val / total) * 100).toFixed(2);
};

const FinancialSummary = () => {
    const [selectedDate, setSelectedDate] = useState(isoDate(new Date()));
    const [dayRows, setDayRows] = useState([]);
    const [mtdRows, setMtdRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const dateObj = new Date(selectedDate);
                const firstOfMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-01`;
                const [resDay, resMtd] = await Promise.all([
                    api.get(`/ledger/?date=${selectedDate}`),
                    api.get(`/ledger/?start_date=${firstOfMonth}&end_date=${selectedDate}`)
                ]);
                setDayRows(resDay.data || []);
                setMtdRows(resMtd.data || []);
            } catch (err) { console.error("Fetch Error:", err); }
            finally { setLoading(false); }
        };
        loadData();
    }, [selectedDate]);

    const aggregate = (rows) => {
        const s = { acc: 0, food: 0, bar: 0, lndry: 0, pool: 0, room: 0, other: 0, usd_swp: 0, eco: 0, zig: 0, cash: 0, ledg: 0, bank: 0 };
        rows.forEach(r => {
            s.acc += toNumber(r.acc); s.food += toNumber(r.food); s.bar += toNumber(r.bar);
            s.lndry += toNumber(r.lndry); s.pool += toNumber(r.pool); s.room += toNumber(r.room);
            s.other += toNumber(r.other); s.usd_swp += toNumber(r.usd_swp); s.eco += toNumber(r.eco);
            s.zig += toNumber(r.zig); s.cash += toNumber(r.cash); s.ledg += toNumber(r.ledg); s.bank += toNumber(r.bank);
        });
        const charges = s.acc + s.food + s.bar + s.lndry + s.pool + s.room + s.other;
        const payments = s.usd_swp + s.eco + s.zig + s.cash + s.ledg + s.bank;
        return { ...s, totalSales: charges, totalCash: s.usd_swp + s.eco + s.zig + s.cash + s.bank, debtors: charges - payments };
    };

    const day = useMemo(() => aggregate(dayRows), [dayRows]);
    const mtd = useMemo(() => aggregate(mtdRows), [mtdRows]);

    if (loading) return <div className="loading-state">Syncing Financials...</div>;

    return (
        <div className="financial-report-scroll-container">
            {/* STICKY DATE HEADER */}
            <header className="sticky-date-navigator">
                <div className="nav-content">
                    <button onClick={() => {
                        const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(isoDate(d));
                    }} className="nav-btn">← PREVIOUS</button>
                    
                    <div className="date-badge">
                        <span>LEDGER SUMMARY:</span>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>

                    <button onClick={() => {
                        const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(isoDate(d));
                    }} className="nav-btn">NEXT →</button>
                </div>
            </header>

            <main className="snap-wrapper">
                {/* SECTION 1: DEPARTMENTAL SALES */}
                <section className="report-section">
                    <div className="section-card">
                        <div className="card-header"><h3>Departmental Sales Summary</h3></div>
                        <div className="table-container">
                            <table className="fin-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Department</th>
                                        <th colSpan="2" className="group-head">{selectedDate} (Actual)</th>
                                        <th colSpan="2" className="group-head">Month To Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { n: 'ACCOMMODATION', d: day.acc, m: mtd.acc },
                                        { n: 'FOOD', d: day.food, m: mtd.food },
                                        { n: 'BEVERAGES', d: day.bar, m: mtd.bar },
                                        { n: 'SWIMMING POOL', d: day.pool, m: mtd.pool },
                                        { n: 'LAUNDRY', d: day.lndry, m: mtd.lndry },
                                        { n: 'ROOM HIRE', d: day.room, m: mtd.room },
                                        { n: 'OTHER', d: day.other, m: mtd.other }
                                    ].map((row, i) => (
                                        <tr key={i}>
                                            <td className="text-left">{row.n}</td>
                                            <td className="numeric">{formatCurrency(row.d)}</td>
                                            <td className="percent">{formatPercent(row.d, day.totalSales)}</td>
                                            <td className="numeric">{formatCurrency(row.m)}</td>
                                            <td className="percent">{formatPercent(row.m, mtd.totalSales)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="total-row">
                                        <td className="text-left">TOTAL SALES</td>
                                        <td className="numeric">{formatCurrency(day.totalSales)}</td>
                                        <td className="percent">100.00</td>
                                        <td className="numeric">{formatCurrency(mtd.totalSales)}</td>
                                        <td className="percent">100.00</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: REVENUE CASH SUMMARY */}
                <section className="report-section">
                    <div className="section-card">
                        <div className="card-header"><h3>Revenue Cash Summary</h3></div>
                        <div className="table-container">
                            <table className="fin-table">
                                <thead>
                                    <tr>
                                        <th className="text-left">Description</th>
                                        <th colSpan="2" className="group-head">{selectedDate}</th>
                                        <th colSpan="2" className="group-head">MTD</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td className="text-left">USD SWIPE</td><td className="numeric">{formatCurrency(day.usd_swp)}</td><td className="percent">-</td><td className="numeric">{formatCurrency(mtd.usd_swp)}</td><td className="percent">-</td></tr>
                                    <tr><td className="text-left">ECOCASH (ECO)</td><td className="numeric">{formatCurrency(day.eco)}</td><td className="percent">-</td><td className="numeric">{formatCurrency(mtd.eco)}</td><td className="percent">-</td></tr>
                                    <tr><td className="text-left">ZIG / BANK</td><td className="numeric">{formatCurrency(day.zig + day.bank)}</td><td className="percent">-</td><td className="numeric">{formatCurrency(mtd.zig + mtd.bank)}</td><td className="percent">-</td></tr>
                                    <tr><td className="text-left">USD CASH</td><td className="numeric">{formatCurrency(day.cash)}</td><td className="percent">-</td><td className="numeric">{formatCurrency(mtd.cash)}</td><td className="percent">-</td></tr>
                                    <tr className="subtotal-row">
                                        <td className="text-left">TOTAL CASH</td>
                                        <td className="numeric">{formatCurrency(day.totalCash)}</td>
                                        <td className="percent">0.00</td>
                                        <td className="numeric">{formatCurrency(mtd.totalCash)}</td>
                                        <td className="percent">{formatPercent(mtd.totalCash, mtd.totalSales)}</td>
                                    </tr>
                                    <tr><td className="text-left">DEBTORS IN RESIDENCE</td><td className={`numeric ${day.debtors !== 0 ? 'negative-val' : ''}`}>{formatCurrency(day.debtors)}</td><td className="percent">0.00</td><td className={`numeric ${mtd.debtors !== 0 ? 'negative-val' : ''}`}>{formatCurrency(mtd.debtors)}</td><td className="percent">{formatPercent(mtd.debtors, mtd.totalSales)}</td></tr>
                                    <tr><td className="text-left">T / T LEDGER</td><td className="numeric">{formatCurrency(day.ledg)}</td><td className="percent">0.00</td><td className="numeric">{formatCurrency(mtd.ledg)}</td><td className="percent">{formatPercent(mtd.ledg, mtd.totalSales)}</td></tr>
                                </tbody>
                                <tfoot>
                                    <tr className="total-row grand-total">
                                        <td className="text-left">TOTAL REVENUE</td>
                                        <td className="numeric">{formatCurrency(day.totalSales)}</td>
                                        <td className="percent">{formatCurrency(day.totalCash)}</td>
                                        <td className="numeric">{formatCurrency(mtd.totalSales)}</td>
                                        <td className="percent">100.00</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FinancialSummary;