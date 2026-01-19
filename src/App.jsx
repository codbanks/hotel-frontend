import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, Suspense, lazy } from "react";

// Layouts
import ProtectedLayout from "./components/Layout/ProtectedLayout";

// Auth
import Login from "./components/Login";

// --- LAZY LOADED PAGES (Performance Optimization) ---
// This ensures your app loads fast even as you add 50 more reports.

const Dashboard = lazy(() => import("./pages/Dashboard"));
const HouseStatusReport = lazy(() => import("./pages/HouseStatusReport"));

// Ledger & Invoice
const Ledger = lazy(() => import("./pages/ledger/Ledger"));
const Invoice = lazy(() => import("./pages/Invoice/Invoice"));
const InvoiceDetail = lazy(() => import("./pages/Invoice/InvoiceDetail"));

// Reports
const DailyRevenue = lazy(() => import("./pages/reports/DailyRevenue"));
const OccupancySales = lazy(() => import("./pages/reports/OccupancySales"));
const SalesMarketing = lazy(() => import("./pages/reports/SalesMarketing"));
const DeptSalesSummary = lazy(() => import("./pages/reports/DeptSalesSummary"));
const CustomerSegmentation = lazy(() => import("./pages/reports/CustomerSegmentation"));
const StaffDebtors = lazy(() => import("./pages/reports/StaffDebtors"));

// Loading UI
const LoadingSpinner = () => (
  <div style={{ 
    height: '100vh', 
    width: '100%', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    background: '#1a1c23', 
    color: '#C6A84E' 
  }}>
    <h3>Loading Pumpkin OS...</h3>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem("access")
  );

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? (
                <Login onAuth={handleLogin} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />

          {/* Protected Routes */}
          {isAuthenticated ? (
            <>
              <Route path="/" element={<ProtectedLayout onLogout={handleLogout}><Dashboard /></ProtectedLayout>} />
              <Route path="/ledger" element={<ProtectedLayout onLogout={handleLogout}><Ledger /></ProtectedLayout>} />
              <Route path="/invoice" element={<ProtectedLayout onLogout={handleLogout}><Invoice /></ProtectedLayout>} />
              <Route path="/invoices" element={<ProtectedLayout onLogout={handleLogout}><Invoice /></ProtectedLayout>} />
              <Route path="/invoice/new" element={<ProtectedLayout onLogout={handleLogout}><InvoiceDetail /></ProtectedLayout>} />
              <Route path="/invoice/:id" element={<ProtectedLayout onLogout={handleLogout}><InvoiceDetail /></ProtectedLayout>} />
              
              {/* Reports */}
              <Route path="/housestatusreport" element={<ProtectedLayout onLogout={handleLogout}><HouseStatusReport /></ProtectedLayout>} />
              <Route path="/occupancy-sales" element={<ProtectedLayout onLogout={handleLogout}><OccupancySales /></ProtectedLayout>} />
              <Route path="/daily-revenue" element={<ProtectedLayout onLogout={handleLogout}><DailyRevenue /></ProtectedLayout>} />
              <Route path="/sales-marketing" element={<ProtectedLayout onLogout={handleLogout}><SalesMarketing /></ProtectedLayout>} />
              <Route path="/dept-sales-summary" element={<ProtectedLayout onLogout={handleLogout}><DeptSalesSummary /></ProtectedLayout>} />
              <Route path="/client-segments" element={<ProtectedLayout onLogout={handleLogout}><CustomerSegmentation /></ProtectedLayout>} />
              <Route path="/staff-debtors" element={<ProtectedLayout onLogout={handleLogout}><StaffDebtors /></ProtectedLayout>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Suspense>
    </Router>
  );
}
 
export default App;