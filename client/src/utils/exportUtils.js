/**
 * CSV and Printable PDF Export Utilities
 */

export function exportToCSV(filename, rows, headers) {
  if (!rows || !rows.length) return;

  const headerRow = headers.map((h) => `"${h.label}"`).join(',');
  const dataRows = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printInvoiceDocument(invoiceId = 'invoice-receipt-print') {
  const elem = document.getElementById(invoiceId);
  if (!elem) {
    window.print();
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sridevi Residency - Invoice</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 12px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .subtitle { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background-color: #f4f4f4; }
          .total { font-weight: bold; font-size: 16px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        ${elem.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 350);
}
