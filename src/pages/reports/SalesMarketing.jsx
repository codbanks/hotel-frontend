import React, { useState, useEffect } from 'react';
// Corrected CSS path to the root level to improve resolution robustness
import '../../styles/SalesMarketing.css';

// --- Utility Functions ---

// Formats a number to two decimal places, returning a string
const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
        return '-';
    }
    return num.toFixed(decimals);
};

// Formats currency, handling NaN/Infinity by returning error string
const formatCurrency = (num) => {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
        return <span className="error-text">-</span>;
    }
    return `$ ${num.toFixed(2)}`;
};

// Calculates percentage, handles division by zero by returning a special marker
const calculatePercentage = (numerator, denominator) => {
    if (denominator === 0 || denominator === null || denominator === undefined) {
        return { value: NaN, display: <span className="error-text">0.00</span> };
    }
    const value = (numerator / denominator) * 100;
    return { value, display: formatNumber(value) };
};

// Calculates Average Rate, handles division by zero
const calculateAverageRate = (revenue, roomNights) => {
    if (roomNights === 0 || roomNights === null || roomNights === undefined) {
        return { value: NaN, display: <span className="error-text">#DIV/0!</span> };
    }
    const value = revenue / roomNights;
    return { value, display: formatCurrency(value) };
};


// --- MOCK DATA / BACKEND FETCH SIMULATION ---
function fetchSalesData(date) {
    console.log(`Fetching Sales & Marketing data for: ${date}`);

    // Data based on the user's screenshot for 15-Jul-25 (Daily/MTD)
    // Values represent { dayBedNights, dayRoomNights, dayRevenue, mtdBedNights, mtdRoomNights, mtdRevenue }
    return {
        Conference: { dbn: 0, drn: 0, dr: 0, mbn: 0, mrn: 0, mr: 0 },
        Business:   { dbn: 0, drn: 0, dr: 0, mbn: 136, mrn: 132, mr: 6505.00 },
        Transit:    { dbn: 0, drn: 0, dr: 0, mbn: 0, mrn: 0, mr: 0 },
        Leisure:    { dbn: 0, drn: 0, dr: 0, mbn: 0, mrn: 0, mr: 0 },
        
        // Non-segmented items (Comp and House Use)
        Complimentary: { dbn: 0, drn: 0, dr: 0, mbn: 2, mrn: 2, mr: 0 },
        HouseUse:      { dbn: 1, drn: 1, dr: 0, mbn: 18, mrn: 18, mr: 0 },
    };
}


// --- CALCULATION ENGINE ---
function calculateSalesReports(rawData) {
    const segments = ['Conference', 'Business', 'Transit', 'Leisure'];

    // 1. Calculate TOTALS for Day and MTD (Segments only)
    const dailyTotal = segments.reduce((acc, key) => ({
        bedNights: acc.bedNights + rawData[key].dbn,
        roomNights: acc.roomNights + rawData[key].drn,
        revenue: acc.revenue + rawData[key].dr,
    }), { bedNights: 0, roomNights: 0, revenue: 0 });

    const mtdTotal = segments.reduce((acc, key) => ({
        bedNights: acc.bedNights + rawData[key].mbn,
        roomNights: acc.roomNights + rawData[key].mrn,
        revenue: acc.revenue + rawData[key].mr,
    }), { bedNights: 0, roomNights: 0, revenue: 0 });


    // 2. Process Segment Rows
    const segmentData = segments.map(key => {
        const item = rawData[key];

        // Day Calculations
        const dayContr = calculatePercentage(item.dbn, dailyTotal.bedNights);
        const dayCont = calculatePercentage(item.drn, dailyTotal.roomNights);
        const dayRate = calculateAverageRate(item.dr, item.drn);

        // MTD Calculations
        const mtdContr = calculatePercentage(item.mbn, mtdTotal.bedNights);
        const mtdCont = calculatePercentage(item.mrn, mtdTotal.roomNights);
        const mtdRate = calculateAverageRate(item.mr, item.mrn);

        return {
            segment: key,
            day: {
                bedNights: item.dbn, contr: dayContr, roomNights: item.drn, cont: dayCont,
                revenue: item.dr, rate: dayRate
            },
            mtd: {
                bedNights: item.mbn, contr: mtdContr, roomNights: item.mrn, cont: mtdCont,
                revenue: item.mr, rate: mtdRate
            }
        };
    });

    // 3. Create TOTAL Segment Row
    const totalSegmentRow = {
        segment: "TOTAL",
        isTotal: true,
        day: {
            bedNights: dailyTotal.bedNights,
            contr: calculatePercentage(dailyTotal.bedNights, dailyTotal.bedNights), // Always 100%
            roomNights: dailyTotal.roomNights,
            cont: calculatePercentage(dailyTotal.roomNights, dailyTotal.roomNights), // Always 100%
            revenue: dailyTotal.revenue,
            rate: calculateAverageRate(dailyTotal.revenue, dailyTotal.roomNights)
        },
        mtd: {
            bedNights: mtdTotal.bedNights,
            contr: calculatePercentage(mtdTotal.bedNights, mtdTotal.bedNights),
            roomNights: mtdTotal.roomNights,
            cont: calculatePercentage(mtdTotal.roomNights, mtdTotal.roomNights),
            revenue: mtdTotal.revenue,
            rate: calculateAverageRate(mtdTotal.revenue, mtdTotal.roomNights)
        }
    };


    // 4. Handle Complimentary and House Use (Non-Segmented)
    const compRow = {
        segment: "COMPLIMENTARY",
        isComp: true,
        day: {
            bedNights: rawData.Complimentary.dbn,
            contr: { value: 0, display: formatNumber(0) }, // Contributes to Grand Total, but not segment %contr
            roomNights: rawData.Complimentary.drn,
            cont: { value: 0, display: formatNumber(0) },
            revenue: rawData.Complimentary.dr,
            rate: calculateAverageRate(rawData.Complimentary.dr, rawData.Complimentary.drn)
        },
        mtd: {
            bedNights: rawData.Complimentary.mbn,
            // Calculate percentage based on Grand Total MTD Bednights (for display consistency with grand total row)
            contr: calculatePercentage(rawData.Complimentary.mbn, mtdTotal.bedNights + rawData.Complimentary.mbn + rawData.HouseUse.mbn), 
            roomNights: rawData.Complimentary.mrn,
            // Calculate percentage based on Grand Total MTD Roomnights (for display consistency)
            cont: calculatePercentage(rawData.Complimentary.mrn, mtdTotal.roomNights + rawData.Complimentary.mrn + rawData.HouseUse.mrn),
            revenue: rawData.Complimentary.mr,
            rate: calculateAverageRate(rawData.Complimentary.mr, rawData.Complimentary.mrn)
        }
    };
    
    const houseUseRow = {
        segment: "HOUSE USE",
        isHouseUse: true,
        day: {
            bedNights: rawData.HouseUse.dbn,
            contr: { value: 0, display: formatNumber(0) }, 
            roomNights: rawData.HouseUse.drn,
            cont: { value: 0, display: formatNumber(0) },
            revenue: rawData.HouseUse.dr,
            rate: calculateAverageRate(rawData.HouseUse.dr, rawData.HouseUse.drn)
        },
        mtd: {
            bedNights: rawData.HouseUse.mbn,
            // Calculate percentage based on Grand Total MTD Bednights
            contr: calculatePercentage(rawData.HouseUse.mbn, mtdTotal.bedNights + rawData.Complimentary.mbn + rawData.HouseUse.mbn),
            roomNights: rawData.HouseUse.mrn,
            // Calculate percentage based on Grand Total MTD Roomnights
            cont: calculatePercentage(rawData.HouseUse.mrn, mtdTotal.roomNights + rawData.Complimentary.mrn + rawData.HouseUse.mrn),
            revenue: rawData.HouseUse.mr,
            rate: calculateAverageRate(rawData.HouseUse.mr, rawData.HouseUse.mrn)
        }
    };
    
    // 5. Calculate GRAND TOTAL (All rows)
    const grandTotalDay = {
        bedNights: dailyTotal.bedNights + compRow.day.bedNights + houseUseRow.day.bedNights,
        roomNights: dailyTotal.roomNights + compRow.day.roomNights + houseUseRow.day.roomNights,
        revenue: dailyTotal.revenue + compRow.day.revenue + houseUseRow.day.revenue,
    };
    
    const grandTotalMTD = {
        bedNights: mtdTotal.bedNights + compRow.mtd.bedNights + houseUseRow.mtd.bedNights,
        roomNights: mtdTotal.roomNights + compRow.mtd.roomNights + houseUseRow.mtd.roomNights,
        revenue: mtdTotal.revenue + compRow.mtd.revenue + houseUseRow.mtd.revenue,
    };
    
    const grandTotalRow = {
        segment: "TOTAL",
        isGrandTotal: true,
        day: {
            bedNights: grandTotalDay.bedNights,
            contr: calculatePercentage(grandTotalDay.bedNights, grandTotalDay.bedNights),
            roomNights: grandTotalDay.roomNights,
            cont: calculatePercentage(grandTotalDay.roomNights, grandTotalDay.roomNights),
            revenue: grandTotalDay.revenue,
            rate: calculateAverageRate(grandTotalDay.revenue, grandTotalDay.roomNights)
        },
        mtd: {
            bedNights: grandTotalMTD.bedNights,
            contr: calculatePercentage(grandTotalMTD.bedNights, grandTotalMTD.bedNights),
            roomNights: grandTotalMTD.roomNights,
            cont: calculatePercentage(grandTotalMTD.roomNights, grandTotalMTD.roomNights),
            revenue: grandTotalMTD.revenue,
            rate: calculateAverageRate(grandTotalMTD.revenue, grandTotalMTD.roomNights)
        }
    };


    return [
        ...segmentData,
        totalSegmentRow,
        compRow,
        houseUseRow,
        grandTotalRow
    ];
}


// --- REACT COMPONENT ---
const SalesMarketing = () => {
    const [reportData, setReportData] = useState([]);
    const [currentDate, setCurrentDate] = useState('2025-07-15');

    // Fetch and calculate data on mount/date change
    useEffect(() => {
        const rawData = fetchSalesData(currentDate);
        const calculatedData = calculateSalesReports(rawData);
        setReportData(calculatedData);
    }, [currentDate]);

    // Placeholder functions for date navigation
    const handlePrevDay = () => console.log("Navigating to previous day...");
    const handleNextDay = () => console.log("Navigating to next day...");

    // Helper function to determine row class
    const getRowClass = (row) => {
        if (row.isGrandTotal) return 'grand-total-row';
        if (row.isTotal) return 'total-row';
        return '';
    };

    // Helper to render columns for a period (Day or MTD)
    const renderPeriodColumns = (periodData) => (
        <>
            <td className="numeric">{formatNumber(periodData.bedNights, 0)}</td>
            <td className="numeric">{periodData.contr.display}</td>
            <td className="numeric">{formatNumber(periodData.roomNights, 0)}</td>
            <td className="numeric">{periodData.cont.display}</td>
            <td className="currency">{formatCurrency(periodData.revenue)}</td>
            <td className="currency">{periodData.rate.display}</td>
        </>
    );

    return (
        <div className="sales-marketing-container">
            <div className="report-header">
                <button className="date-nav-btn" onClick={handlePrevDay}>❮ Prev</button>
                <div className="report-header-center">
                    <h1 className="report-title">Sales and Marketing Segmentation</h1>
                    <p className="report-sub">Date: <span>{currentDate}</span></p>
                </div>
                <button className="date-nav-btn" onClick={handleNextDay}>Next ❯</button>
            </div>

            <div className="table-wrapper">
                <table id="analysisTable">
                    <thead>
                        <tr>
                            <th rowSpan="2" style={{ verticalAlign: 'bottom' }}>Segment</th>
                            <th colSpan="6" className="group-header">Daily Stats (Actual)</th>
                            <th colSpan="6" className="group-header">Month To Date</th>
                        </tr>
                        <tr>
                            <th>Bed Nights</th><th>%Contr</th>
                            <th>Room Nights</th><th>% Cont</th>
                            <th className="currency">Revenue</th><th className="currency">Ave Rm Rate</th>
                            
                            <th>Bed Nights</th><th>%Contr</th>
                            <th>Room Nights</th><th>% Cont</th>
                            <th className="currency">Revenue</th><th className="currency">Ave Rm Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((row, index) => (
                            <tr key={index} className={getRowClass(row)}>
                                <td>{row.segment}</td>
                                {renderPeriodColumns(row.day)}
                                {renderPeriodColumns(row.mtd)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SalesMarketing;