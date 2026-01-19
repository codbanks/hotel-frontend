import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api/api';
import '../../styles/OccupancySales.css';

// --- ACCURATE ROOM MAPPING ---
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

const OccupancySales = () => {
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Physical Capacity
    const TOTAL_ROOMS_IN_HOTEL = 58;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetching all invoices/house status records
            const response = await api.get('/invoice/invoices/');
            setInvoices(response.data);
        } catch (err) {
            console.error("API Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleNavigate = (days) => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + days);
        setCurrentDate(d.toISOString().split('T')[0]);
    };

    const reportData = useMemo(() => {
        const selectedDateObj = new Date(currentDate);
        const mtdDayCount = selectedDateObj.getDate();
        
        // Initializing all counters to 0 - No more dummy numbers
        const stats = {
            day: { bednights: 0, single: 0, double: 0, comp: 0, house: 0, ooo: 0 },
            mtd: { bednights: 0, single: 0, double: 0, comp: 0, house: 0, ooo: 0 }
        };

        const isWithinStay = (inv, dateStr) => dateStr >= inv.arrival_date && dateStr < inv.departure_date;

        for (let i = 1; i <= mtdDayCount; i++) {
            const dateObj = new Date(selectedDateObj);
            dateObj.setDate(i);
            const dateStr = dateObj.toISOString().split('T')[0];

            invoices.forEach(inv => {
                if (isWithinStay(inv, dateStr)) {
                    const roomNum = parseInt(inv.room_no);
                    const type = typeMap[roomNum] || "Double";
                    
                    // Logic for Categorization
                    const isHouseUse = inv.is_house_use === true || inv.guest_name?.toLowerCase().includes('house');
                    const isOOO = inv.status === 'OOO' || inv.is_out_of_order === true;
                    const isComp = parseFloat(inv.rate_allocated) === 0 && !isHouseUse && !isOOO;

                    if (dateStr === currentDate) {
                        if (isOOO) stats.day.ooo++;
                        else if (isHouseUse) stats.day.house++;
                        else if (isComp) stats.day.comp++;
                        else if (type === "Single") stats.day.single++;
                        else stats.day.double++;
                        
                        if (!isOOO) stats.day.bednights += (parseInt(inv.adults || 0) + parseInt(inv.children || 0));
                    }

                    // MTD Accumulation
                    if (isOOO) stats.mtd.ooo++;
                    else if (isHouseUse) stats.mtd.house++;
                    else if (isComp) stats.mtd.comp++;
                    else if (type === "Single") stats.mtd.single++;
                    else stats.mtd.double++;
                    
                    if (!isOOO) stats.mtd.bednights += (parseInt(inv.adults || 0) + parseInt(inv.children || 0));
                }
            });
        }

        const createRow = (label, dAct, mAct, dBud = 0, mBud = 0) => ({
            label,
            day: { actual: dAct, budget: dBud, var: dAct - dBud },
            mtd: { actual: mAct, budget: mBud, var: mAct - mBud }
        });

        // CALCULATIONS BASED ON EXCEL FORMULAS
        const dSold = stats.day.single + stats.day.double;
        const mSold = stats.mtd.single + stats.mtd.double;

        const dTotalOcc = dSold + stats.day.comp + stats.day.house;
        const mTotalOcc = mSold + stats.mtd.comp + stats.mtd.house;

        const dRoomsAvail = TOTAL_ROOMS_IN_HOTEL;
        const mRoomsAvail = TOTAL_ROOMS_IN_HOTEL * mtdDayCount;

        return [
            createRow("BEDNIGHTS SOLD", stats.day.bednights, stats.mtd.bednights),
            createRow("SINGLE ROOMS", stats.day.single, stats.mtd.single),
            createRow("DOUBLE ROOMS", stats.day.double, stats.mtd.double),
            createRow("ROOMS SOLD", dSold, mSold),
            createRow("COMPLIMENTARY ROOMS", stats.day.comp, stats.mtd.comp),
            createRow("HOUSE USE", stats.day.house, stats.mtd.house),
            createRow("TOTAL ROOMS OCCUPIED", dTotalOcc, mTotalOcc),
            createRow("ROOMS AVAILABLE", dRoomsAvail, mRoomsAvail, 58, 58 * mtdDayCount),
            createRow("VACANT ROOMS", dRoomsAvail - dTotalOcc, mRoomsAvail - mTotalOcc),
            createRow("OUT OF ORDER ROOMS", stats.day.ooo, stats.mtd.ooo),
            createRow("AVAILABLE TO SELL", dRoomsAvail - stats.day.ooo, mRoomsAvail - stats.mtd.ooo, 58, 58 * mtdDayCount)
        ];
    }, [invoices, currentDate]);

    const getVarClass = (v) => v < 0 ? 'neg' : v > 0 ? 'pos' : '';

    return (
        <div className="pumpkin-main">
            <div className="report-controls">
                <button className="nav-ctrl" onClick={() => handleNavigate(-1)}>PREVIOUS</button>
                <div className="report-title">
                    <h2>OCCUPANCY SALES ANALYSIS</h2>
                    <span>{currentDate}</span>
                </div>
                <button className="nav-ctrl" onClick={() => handleNavigate(1)}>NEXT</button>
            </div>

            <div className="table-wrapper">
                <table className="analysis-table">
                    <thead>
                        <tr className="main-th">
                            <th rowSpan="2">LINE ITEMS</th>
                            <th colSpan="3">DAILY (ACTUAL)</th>
                            <th colSpan="3">MONTH TO DATE</th>
                        </tr>
                        <tr className="sub-th">
                            <th>ACTUAL</th><th>BUDGET</th><th>VAR</th>
                            <th>ACTUAL</th><th>BUDGET</th><th>VAR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="loading">Updating Statistics...</td></tr>
                        ) : reportData.map((row, idx) => (
                            <tr key={idx} className={row.label.includes('TOTAL') || row.label.includes('SELL') ? 'row-bold' : ''}>
                                <td className="row-label">{row.label}</td>
                                <td>{row.day.actual}</td>
                                <td>{row.day.budget}</td>
                                <td className={getVarClass(row.day.var)}>{row.day.var}</td>
                                <td>{row.mtd.actual}</td>
                                <td>{row.mtd.budget}</td>
                                <td className={getVarClass(row.mtd.var)}>{row.mtd.var}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OccupancySales;