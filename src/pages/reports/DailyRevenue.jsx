import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "../../styles/DailyRevenue.css";

const isoDate = (d) => new Date(d).toISOString().split('T')[0];

const n = (v) => {
    const num = Number(String(v || 0).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
};

export default function DailyRevenue() {
    const [currentDate, setCurrentDate] = useState(isoDate(new Date()));
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState({ day: {}, mtd: {} });

    const aggregateData = (ledgerRows, allInvoices, targetDateStr) => {
        const capacity = 58;
        const targetDate = new Date(targetDateStr);
        targetDate.setHours(0, 0, 0, 0);

        // 1. Calculate Rooms Sold (Occupancy Logic)
        // A room is sold if: Arrival <= Target Date AND Departure > Target Date
        const roomsSoldOnDate = allInvoices.filter(inv => {
            const arr = new Date(inv.arrival_date);
            arr.setHours(0, 0, 0, 0);
            
            // If no departure date, assume 1 night stay
            const dep = inv.departure_date ? new Date(inv.departure_date) : new Date(arr);
            if (!inv.departure_date) dep.setDate(dep.getDate() + 1);
            dep.setHours(0, 0, 0, 0);

            return targetDate >= arr && targetDate < dep;
        }).length;

        // 2. Sum Revenue from Ledger Rows
        const sums = {
            rooms_sold: roomsSoldOnDate,
            acc: 0, food: 0, bar: 0,
            usd_swipe: 0, ecocash_zig: 0, t_charge: 0
        };

        ledgerRows.forEach(r => {
            sums.acc += n(r.acc);
            sums.food += n(r.food);
            sums.bar += n(r.bar);
            sums.usd_swipe += n(r.usd_swipe);
            sums.ecocash_zig += n(r.ecocash_zig);
            sums.t_charge += n(r.t_charge);
        });

        return {
            ...sums,
            occ_pct: (sums.rooms_sold / capacity) * 100,
            arr: sums.rooms_sold > 0 ? (sums.acc / sums.rooms_sold) : 0,
        };
    };

    useEffect(() => {
        const loadReport = async () => {
            setLoading(true);
            try {
                const startOfMonth = `${currentDate.substring(0, 7)}-01`;
                
                // Fetch Ledger for money, Invoices for occupancy stay-durations
                const [resDay, resMtd, resInvoices] = await Promise.all([
                    api.get(`/ledger/?date=${currentDate}`),
                    api.get(`/ledger/?start_date=${startOfMonth}&end_date=${currentDate}`),
                    api.get(`/invoices/`) 
                ]);

                setReport({
                    day: aggregateData(resDay.data || [], resInvoices.data || [], currentDate),
                    mtd: aggregateData(resMtd.data || [], resInvoices.data || [], currentDate)
                });
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadReport();
    }, [currentDate]);

    const renderMoney = (val) => `$ ${n(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (loading) return <div className="loading-screen">Calculating Revenue Data...</div>;

    return (
        <div className="daily-revenue-wrapper">
            <header className="report-nav">
                <Link to="/" className="nav-back">← DASHBOARD</Link>
                <div className="nav-main">
                    <button className="btn-orange" onClick={() => {
                        let d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(isoDate(d));
                    }}>PREV</button>
                    <div className="nav-title">
                        <h1>DAILY REVENUE REPORT</h1>
                        <span>DATE: {currentDate}</span>
                    </div>
                    <button className="btn-orange" onClick={() => {
                        let d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(isoDate(d));
                    }}>NEXT</button>
                </div>
                <div className="nav-stat">CAPACITY: 58 ROOMS</div>
            </header>

            <div className="report-scroll-area">
                <table className="revenue-table">
                    <thead>
                        <tr className="head-row">
                            <th rowSpan="2">REVENUE ITEM</th>
                            <th colSpan="2">DAILY ACTUAL</th>
                            <th colSpan="2">MONTH TO DATE</th>
                        </tr>
                        <tr className="sub-head-row">
                            <th>ACTUAL</th><th>VARIANCE</th>
                            <th>ACTUAL</th><th>VARIANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>ROOMS AVAILABLE</td>
                            <td className="text-right">58</td><td>-</td>
                            <td className="text-right">58</td><td>-</td>
                        </tr>
                        <tr>
                            <td>ROOMS SOLD</td>
                            <td className="text-right">{report.day.rooms_sold}</td><td>-</td>
                            <td className="text-right">{report.mtd.rooms_sold}</td><td>-</td>
                        </tr>
                        <tr>
                            <td>ROOM OCCUPANCY %</td>
                            <td className="text-right">{n(report.day.occ_pct).toFixed(1)}%</td><td>-</td>
                            <td className="text-right">{n(report.mtd.occ_pct).toFixed(1)}%</td><td>-</td>
                        </tr>
                        <tr className="row-highlight">
                            <td>ROOMS REVENUE (ACC)</td>
                            <td className="text-right">{renderMoney(report.day.acc)}</td><td>-</td>
                            <td className="text-right">{renderMoney(report.mtd.acc)}</td><td>-</td>
                        </tr>
                        <tr>
                            <td>AVERAGE ROOM RATE (ARR)</td>
                            <td className="text-right">{renderMoney(report.day.arr)}</td><td>-</td>
                            <td className="text-right">{renderMoney(report.mtd.arr)}</td><td>-</td>
                        </tr>
                        <tr>
                            <td>FOOD ACTUAL SALES</td>
                            <td className="text-right">{renderMoney(report.day.food)}</td><td>-</td>
                            <td className="text-right">{renderMoney(report.mtd.food)}</td><td>-</td>
                        </tr>
                        <tr>
                            <td>BAR ACTUAL REVENUE</td>
                            <td className="text-right">{renderMoney(report.day.bar)}</td><td>-</td>
                            <td className="text-right">{renderMoney(report.mtd.bar)}</td><td>-</td>
                        </tr>
                        <tr className="row-credit">
                            <td>USD SWIPE (CREDIT)</td>
                            <td className="text-right">{renderMoney(report.day.usd_swipe)}</td><td>-</td>
                            <td className="text-right">{renderMoney(report.mtd.usd_swipe)}</td><td>-</td>
                        </tr>
                        <tr className="row-credit">
                            <td>ECOCASH (CREDIT)</td>
                            <td className="text-right">{renderMoney(report.day.ecocash_zig)}</td><td>-</td>
                            <td className="text-right">{renderMoney(report.mtd.ecocash_zig)}</td><td>-</td>
                        </tr>
                        <tr className="row-grand-total">
                            <td>TOTAL HOTEL REVENUE</td>
                            <td className="text-right">{renderMoney(report.day.t_charge)}</td>
                            <td>-</td>
                            <td className="text-right">{renderMoney(report.mtd.t_charge)}</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}