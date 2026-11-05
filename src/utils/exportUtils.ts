export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((fieldName) => {
          const val = row[fieldName] ?? '';
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, title: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);

  const tableHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8" /></head>
      <body>
        <h3>${title}</h3>
        <table border="1">
          <thead>
            <tr>${headers.map((h) => `<th style="background:#f1f5f9;font-weight:bold;">${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportReportToPdf(
  title: string,
  subtitle: string,
  rows: Record<string, any>[]
) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; padding: 24px; color: #0f172a; }
          h1 { font-size: 20px; margin: 0 0 4px 0; }
          p { font-size: 12px; color: #475569; margin: 0 0 16px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>${subtitle} • Generated on ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${headers.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

export function printInvoiceReceipt(
  sale: any,
  businessName = 'Smart POS Store & Pharmacy',
  gstin = '29AABCA1234F1Z5',
  currency = '₹',
  footerNote = 'Thank you for shopping with us!'
) {
  const win = window.open('', '_blank', 'width=420,height=650');
  if (!win) return;

  const itemsHtml = (sale.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding:4px 0;">
          <div style="font-weight:600;">${item.product?.name || item.productName || 'Item'}</div>
          <div style="font-size:10px;color:#64748b;">Batch: ${item.batchNumber} | Tax: ${item.taxPercentage}%</div>
        </td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${currency}${Number(item.unitPrice).toFixed(2)}</td>
        <td style="text-align:right;font-weight:600;">${currency}${Number(item.totalAmount).toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  win.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Invoice ${sale.invoiceNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 320px; margin: 0 auto; padding: 16px; color: #000; font-size: 12px; }
          .center { text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { border-bottom: 1px dashed #000; padding-bottom: 4px; text-align: left; }
          .totals-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .grand { font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center">
          <div style="font-size:16px;font-weight:bold;">${businessName}</div>
          <div>GSTIN: ${gstin}</div>
          <div style="margin-top:4px;font-weight:bold;">TAX INVOICE</div>
        </div>
        <div class="divider"></div>
        <div>Invoice No: <b>${sale.invoiceNumber}</b></div>
        <div>Date: ${new Date(sale.saleDate || Date.now()).toLocaleString()}</div>
        <div>Customer: ${sale.customerName || 'Walk-in Customer'} ${sale.customerPhone ? `(${sale.customerPhone})` : ''}</div>
        <div>Status: ${sale.status}</div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="divider"></div>
        <div class="totals-row"><span>Subtotal:</span><span>${currency}${Number(sale.subtotal).toFixed(2)}</span></div>
        <div class="totals-row"><span>Item Discounts:</span><span>-${currency}${Number(sale.itemDiscountTotal || 0).toFixed(2)}</span></div>
        <div class="totals-row"><span>Bill Discount:</span><span>-${currency}${Number(sale.billDiscountAmount || 0).toFixed(2)}</span></div>
        <div class="totals-row"><span>GST / Tax:</span><span>+${currency}${Number(sale.taxAmount || 0).toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="totals-row grand"><span>GRAND TOTAL:</span><span>${currency}${Number(sale.grandTotal).toFixed(2)}</span></div>
        <div class="totals-row"><span>Paid Amount:</span><span>${currency}${Number(sale.paidAmount || 0).toFixed(2)}</span></div>
        ${Number(sale.dueAmount) > 0 ? `<div class="totals-row"><span>Balance Due:</span><span>${currency}${Number(sale.dueAmount).toFixed(2)}</span></div>` : ''}
        <div class="divider"></div>
        <div class="center" style="font-size:11px;margin-top:8px;">${footerNote}</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

