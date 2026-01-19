import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/Dashboard.css";

const reports = [
  { path: "/daily-revenue", title: "DAILY REVENUE REPORT", emoji: "📈", desc: "Revenue breakdown" },
  { path: "/occupancy-sales", title: "OCCUPANCY SALES ANALYSIS", emoji: "🏨", desc: "Occupancy & yield" },
  { path: "/sales-marketing", title: "SALES AND MARKETING SEGMENTATION", emoji: "🎯", desc: "Channel performance" },
  { path: "/dept-sales-summary", title: "DEPARTMENTAL SALES SUMMARY", emoji: "🧾", desc: "Department KPIs" },
  { path: "/revenue-cash", title: "REVENUE CASH SUMMARY", emoji: "💵", desc: "Cash vs other modes" },
  { path: "/staff-debtors", title: "STAFF DEBTORS", emoji: "👥", desc: "Staff outstanding balances" },
];

export default function Dashboard() {
  return (
    <div className="dashboard-shell">
      {/* background animation layer */}
      <div className="bg-animated">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <main className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h2 className="dashboard-title">🏨 Hotel Dashboard</h2>
            <p className="dashboard-sub">
              Quick access to all hotel performance reports
            </p>
          </div>

          <div className="summary-glass">
            <div className="summary-item">
              <div className="summary-label">Today</div>
              <div className="summary-value">Oct 24 2025</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Live Occupancy</div>
              <div className="summary-value">72%</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Avg Rev / Room</div>
              <div className="summary-value">$64.20</div>
            </div>
          </div>
        </header>

        <section className="report-links">
          {reports.map((rep, i) => (
            <motion.div
              key={rep.path}
              className="report-card-wrapper"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 120 }}
            >
              <motion.div
                whileHover={{ scale: 1.04, rotateX: -4, rotateY: 4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 180, damping: 10 }}
              >
                <Link to={rep.path} className="report-link">
                  <div className="link-left">{rep.emoji}</div>
                  <div className="link-middle">
                    <div className="link-title">{rep.title}</div>
                    <div className="link-desc">{rep.desc}</div>
                  </div>
                  <div className="link-right">
                    <svg
                      width="26"
                      height="26"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </section>

        <footer className="dashboard-footer">
          <small>© 2025 Hotel Analytics Board. All rights reserved.</small>
        </footer>
      </main>
    </div>
  );
}
