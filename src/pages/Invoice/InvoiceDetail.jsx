import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Make sure this path matches where your api.js actually is!
import api from "../../api/api"; 
import "./InvoiceDetail.css"; 

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 👇 FIX: Changed from localStorage to sessionStorage to match your App.jsx
  const access = sessionStorage.getItem("access");

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [invRes, linesRes] = await Promise.all([
        api.get(`/invoice/invoices/${id}/`),
        api.get(`/invoice/invoicelines/?invoice=${id}`),
      ]);
      setInvoice(invRes.data);
      setLines(linesRes.data);
    } catch (err) {
      console.error("Failed to load invoice detail:", err);
      setError("Could not load invoice details.");
      // Handle token expiration
      if (err.response && err.response.status === 401) {
          navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    // 👇 FIX: Checks sessionStorage. If missing, goes to Login.
    if (!access) {
        navigate("/login");
    } else {
        fetchInvoice();
    }
  }, [fetchInvoice, access, navigate]);

  // ... (The rest of the rendering code remains exactly the same)
  if (loading) return <div className="invoice-detail-page"><p className="loading-text">Loading Details...</p></div>;
  if (error) return <div className="invoice-detail-page"><p className="error-text">{error}</p><button className="back-btn" onClick={() => navigate("/invoices")}>Go Back</button></div>;
  if (!invoice) return null;

  const subtotal = lines.reduce((sum, l) => sum + (parseFloat(l.charges) || 0) - (parseFloat(l.credits) || 0), 0);
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <div className="invoice-detail-page">
      <div className="detail-actions">
          <button className="back-btn" onClick={() => navigate("/invoices")}>← Back to List</button>
      </div>

      <div className="invoice-paper">
        <header className="paper-header">
          <div className="brand-section">
            <h1>The Pumpkin Hotel (Pvt) Ltd</h1>
            <p>Head Office: 29 Scanlen Drive, Borrowdale, Harare</p>
            <p>Stand 604 Kotwa • P.O. Box 51</p>
            <p className="vat-line"><b>VAT No:</b> {invoice.vat_number}</p>
          </div>
          <div className="meta-section">
            <h2>TAX INVOICE</h2>
            <div className="invoice-number-box">
                <span>No:</span> {invoice.invoice_number}
            </div>
          </div>
        </header>

        <div className="info-grid">
            <div className="info-column">
                <h3>Bill To:</h3>
                <p><b>Name:</b> {invoice.name}</p>
                <p><b>Address:</b> {invoice.address}</p>
            </div>
        </div>

        <section className="stay-details-grid">
          <div className="detail-item"><label>Arrival</label><span>{invoice.arrival_date}</span></div>
          <div className="detail-item"><label>Departure</label><span>{invoice.departure_date}</span></div>
          <div className="detail-item"><label>Room</label><span>{invoice.room_no}</span></div>
          <div className="detail-item"><label>Type</label><span>{invoice.room_type}</span></div>
          <div className="detail-item"><label>Adults</label><span>{invoice.adults}</span></div>
          <div className="detail-item"><label>Kids</label><span>{invoice.children}</span></div>
          <div className="detail-item"><label>Rate</label><span>{invoice.rate_allocated}</span></div>
          <div className="detail-item"><label>Account</label><span>{invoice.company_account_no}</span></div>
          <div className="detail-item"><label>Recep</label><span>{invoice.receptionist}</span></div>
        </section>

        <table className="paper-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Voucher</th>
              <th>Charges</th>
              <th>Credits</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td>{line.date}</td>
                <td>{line.description}</td>
                <td>{line.voucher}</td>
                <td>{line.charges}</td>
                <td>{line.credits}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="paper-totals">
          <div className="total-row"><span>Sub Total:</span> <span>${subtotal.toFixed(2)}</span></div>
          <div className="total-row"><span>VAT (15%):</span> <span>${vat.toFixed(2)}</span></div>
          <div className="total-row final"><span>Total:</span> <span>${total.toFixed(2)}</span></div>
        </div>

        <div className="paper-footer">
          <p>Guest Signature: _________________________</p>
          <div className="download-section">
            <a
                href={`${process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api/v2"}/invoice/invoices/${id}/pdf/`}
                target="_blank"
                rel="noreferrer"
                className="pdf-download-btn"
            >
                Download Official PDF
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;