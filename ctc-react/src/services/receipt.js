/**
 * Helper to open a printable receipt layout in a new tab/window
 */
export function printReceipt({ student, month, amount, paymentDate, receiptId }) {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Please allow popups to download/print the receipt.');
    return;
  }

  const generatedId = receiptId || `REC-${month.replace('-', '')}-${student.id.slice(0, 4).toUpperCase()}`;
  const formattedDate = paymentDate || new Date().toISOString().split('T')[0];

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt_${generatedId}</title>
      <style>
        body {
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 40px;
          color: #1e293b;
          background-color: #ffffff;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          border: 1px solid #e2e8f0;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: contain;
        }
        .brand-name {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e3a8a;
          margin: 0;
        }
        .receipt-title {
          text-align: right;
        }
        .receipt-title h1 {
          font-size: 1.5rem;
          margin: 0;
          color: #1e3a8a;
          letter-spacing: 0.5px;
        }
        .receipt-title p {
          margin: 4px 0 0;
          font-size: 0.8rem;
          color: #64748b;
          font-family: monospace;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #64748b;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .info-card {
          background-color: #f8fafc;
          padding: 14px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }
        .info-row {
          margin-bottom: 6px;
          font-size: 0.88rem;
          display: flex;
          justify-content: space-between;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          color: #64748b;
          font-weight: 500;
        }
        .info-value {
          color: #0f172a;
          font-weight: 600;
        }
        .table-section {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 28px;
        }
        .table-section th {
          background-color: #f1f5f9;
          color: #475569;
          font-weight: 600;
          text-align: left;
          padding: 10px 12px;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .table-section td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
        }
        .amount-highlight {
          font-size: 1.15rem;
          font-weight: 700;
          color: #2563eb;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          background-color: #dcfce7;
          color: #166534;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .footer {
          margin-top: 36px;
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 18px;
        }
        .footer a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
        }
        @media print {
          body {
            padding: 0;
            background-color: transparent;
          }
          .receipt-container {
            border: none;
            box-shadow: none;
            padding: 0;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="logo-section">
            <img src="/logo.png" alt="CTC Logo" class="logo" onerror="this.style.display='none';" />
            <h2 class="brand-name">Challengers TC</h2>
          </div>
          <div class="receipt-title">
            <h1>FEE RECEIPT</h1>
            <p>ID: ${generatedId}</p>
          </div>
        </div>

        <div class="details-grid">
          <div>
            <div class="section-title">Student Details</div>
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${student.name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Grade:</span>
                <span class="info-value">Grade ${student.grade}</span>
              </div>
              ${student.blood_group ? `
              <div class="info-row">
                <span class="info-label">Blood Group:</span>
                <span class="info-value">${student.blood_group}</span>
              </div>` : ''}
            </div>
          </div>
          <div>
            <div class="section-title">Payment Details</div>
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Parent:</span>
                <span class="info-value">${student.parent_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact:</span>
                <span class="info-value">${student.parent_contact}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        <table class="table-section">
          <thead>
            <tr>
              <th>Description</th>
              <th>Month</th>
              <th>Status</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-weight: 600;">Monthly Tuition Fee</td>
              <td>${month}</td>
              <td><span class="badge">PAID</span></td>
              <td style="text-align: right;" class="amount-highlight">₹${amount}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right; font-weight: 600; border-bottom: none; padding-top: 16px;">Total Paid:</td>
              <td style="text-align: right; font-weight: 700; border-bottom: none; padding-top: 16px;" class="amount-highlight">₹${amount}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 24px; border: 1px dashed #bfdbfe; background-color: #eff6ff; padding: 12px; border-radius: 8px; font-size: 0.8rem; color: #1e40af; text-align: center; font-weight: 500;">
          Thank you for the payment! This is an electronically generated receipt. No signature required.
        </div>

        <div class="footer">
          Powered by <a href="https://www.vikast.me" target="_blank">time2innovate</a> | Engineered by Vikas
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
          // Keep window open for user to save as PDF or print, then they can close it
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(receiptHtml);
  printWindow.document.close();
}

/**
 * Open WhatsApp send page pre-filled with receipt details
 */
export function shareReceiptOnWhatsApp({ student, month, amount, paymentDate }) {
  const rawContact = student.parent_contact || '';
  // Strip non-numeric chars
  let formattedPhone = rawContact.replace(/[^0-9]/g, '');
  
  // Format for international code. India code is 91.
  if (formattedPhone.length === 10) {
    formattedPhone = `91${formattedPhone}`;
  } else if (formattedPhone.startsWith('0') && formattedPhone.length === 11) {
    formattedPhone = `91${formattedPhone.slice(1)}`;
  }

  const formattedDate = paymentDate || new Date().toISOString().split('T')[0];

  const msg = `Hello *${student.parent_name}*,\n\nWe have successfully received the tuition fee payment of *₹${amount}* for *${student.name}* (Grade ${student.grade}) for the month of *${month}* on *${formattedDate}*.\n\nThank you!\n*Challengers Tuition Center*`;

  const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}
