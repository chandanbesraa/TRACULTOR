/**
 * PDF Generation Utility for TRACULATOR
 * Generates professional, print-ready Individual Customer Invoices and Monthly Summary Reports.
 * Uses jsPDF and jspdf-autotable with strict bounding constraints.
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrencyPdf, formatDuration, formatDate, formatTime } from './calculations';

const BRAND = {
  primary: [31, 94, 59],      // #1F5E3B Deep Green
  secondary: [63, 125, 76],   // #3F7D4C
  darkText: [26, 26, 26],     // #1A1A1A
  mutedText: [100, 100, 100],
  bgLight: [247, 247, 245],   // #F7F7F5
  border: [226, 226, 220],
  redText: [197, 48, 48],
};

/**
 * Generates and downloads a high-quality PDF bill for an individual customer job.
 * @param {Object} record - Completed tractor job record
 */
export function generateCustomerBillPDF(record) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm
  let currentY = 15;

  // 1. Brand Header Banner
  doc.setFillColor(...BRAND.primary);
  doc.rect(marginX, currentY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TRACULATOR', marginX + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Track Time. Calculate Earnings.', marginX + 6, currentY + 16);

  // Document Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TRACTOR WORK RECEIPT', pageWidth - marginX - 6, currentY + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Bill Ref: #${record.id || 'TRAC-BILL'}`, pageWidth - marginX - 6, currentY + 16, { align: 'right' });

  currentY += 28;

  // 2. Customer & Work Information Card
  const infoCardHeight = 44;
  doc.setFillColor(...BRAND.bgLight);
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(0.5);
  doc.rect(marginX, currentY, contentWidth, infoCardHeight, 'FD');

  doc.setTextColor(...BRAND.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CUSTOMER & FIELD DETAILS', marginX + 6, currentY + 7);

  doc.setTextColor(...BRAND.darkText);
  doc.setFontSize(9);

  // Left Column
  const col1LabelX = marginX + 6;
  const col1ValX = marginX + 38;
  const col1MaxW = 60;

  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', col1LabelX, currentY + 15);
  doc.setFont('helvetica', 'normal');
  const custName = doc.splitTextToSize(record.customerName || 'N/A', col1MaxW);
  doc.text(custName[0] || 'N/A', col1ValX, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Mobile:', col1LabelX, currentY + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(record.mobileNumber || 'N/A', col1ValX, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Address:', col1LabelX, currentY + 29);
  doc.setFont('helvetica', 'normal');
  const addressText = doc.splitTextToSize(record.address || 'N/A', col1MaxW);
  doc.text(addressText[0] || 'N/A', col1ValX, currentY + 29);

  doc.setFont('helvetica', 'bold');
  doc.text('Location:', col1LabelX, currentY + 36);
  doc.setFont('helvetica', 'normal');
  const locationText = doc.splitTextToSize(record.location || record.address || 'N/A', col1MaxW);
  doc.text(locationText[0] || 'N/A', col1ValX, currentY + 36);

  // Right Column
  const col2LabelX = marginX + 102;
  const col2ValX = marginX + 130;
  const col2MaxW = 50;

  doc.setFont('helvetica', 'bold');
  doc.text('Work Date:', col2LabelX, currentY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(record.date || record.createdAt), col2ValX, currentY + 15);

  doc.setFont('helvetica', 'bold');
  doc.text('Timer Mode:', col2LabelX, currentY + 22);
  doc.setFont('helvetica', 'normal');
  const modeLabel = record.timerMode === 'countdown'
    ? 'Countdown Timer'
    : record.timerMode === 'manual'
    ? 'Manual Entry'
    : 'Manual Stopwatch';
  doc.text(modeLabel, col2ValX, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.text('Work Type:', col2LabelX, currentY + 29);
  doc.setFont('helvetica', 'normal');
  const splitWork = doc.splitTextToSize(record.workDescription || 'Agricultural Tractor Work', col2MaxW);
  doc.text(splitWork[0] || 'Agricultural Tractor Work', col2ValX, currentY + 29);
  if (splitWork[1]) {
    doc.text(splitWork[1], col2ValX, currentY + 34);
  }

  currentY += infoCardHeight + 6;

  // 3. Timing & Rate Breakdown Table (Strict explicit cell widths fitting 182mm)
  const actualDurationMinutes = Math.round(((record.durationSeconds || 0) / 60) * 10) / 10;
  
  doc.autoTable({
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [['START TIME', 'END TIME', 'TOTAL DURATION', 'RATE / MIN', 'WORK AMOUNT']],
    body: [
      [
        record.startTime ? formatTime(record.startTime) : '--',
        record.endTime ? formatTime(record.endTime) : '--',
        `${formatDuration(record.durationSeconds || 0, 'short')} (${actualDurationMinutes}m)`,
        formatCurrencyPdf(record.ratePerMinute) + ' / min',
        formatCurrencyPdf(record.workAmount)
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: BRAND.darkText,
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 32, halign: 'center' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 44, halign: 'center' },
      3: { cellWidth: 36, halign: 'center' },
      4: { cellWidth: 38, halign: 'right', fontStyle: 'bold', textColor: BRAND.primary },
    },
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // 4. Expense Breakdown Table
  const expenses = record.expenses || {};
  const expenseRows = [
    ['Diesel Fuel Expense', formatCurrencyPdf(expenses.diesel || 0)],
    ['Driver Allowance / Wage', formatCurrencyPdf(expenses.driver || 0)],
    ['Food & Refreshments', formatCurrencyPdf(expenses.food || 0)],
    ['Other Maintenance / Field Expenses', formatCurrencyPdf(expenses.other || 0)],
    ['TOTAL OPERATIONAL EXPENSES', formatCurrencyPdf(record.totalExpenses || 0)]
  ];

  doc.autoTable({
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [['OPERATIONAL EXPENSE BREAKDOWN', 'AMOUNT']],
    body: expenseRows,
    theme: 'striped',
    headStyles: {
      fillColor: BRAND.secondary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      cellPadding: 2.5,
    },
    bodyStyles: {
      textColor: BRAND.darkText,
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 132 },
      1: { cellWidth: 50, halign: 'right' },
    },
    didParseCell: function(data) {
      if (data.row.index === 4) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = BRAND.redText;
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // 5. Grand Summary & Net Earnings Box (Strict interior alignment)
  const summaryBoxHeight = 32;
  doc.setFillColor(...BRAND.bgLight);
  doc.setDrawColor(...BRAND.primary);
  doc.setLineWidth(0.8);
  doc.rect(marginX, currentY, contentWidth, summaryBoxHeight, 'FD');

  // Left column summary values
  doc.setTextColor(...BRAND.darkText);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Work Bill Amount:', marginX + 6, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCurrencyPdf(record.workAmount), marginX + 98, currentY + 10, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Less: Total Field Expenses:', marginX + 6, currentY + 21);
  doc.setTextColor(...BRAND.redText);
  doc.setFont('helvetica', 'normal');
  doc.text(`(-) ${formatCurrencyPdf(record.totalExpenses || 0)}`, marginX + 98, currentY + 21, { align: 'right' });

  // Right column Net Earnings Badge (100% inside boundary)
  const badgeWidth = 74;
  const badgeX = marginX + contentWidth - badgeWidth - 4; // 14 + 182 - 74 - 4 = 118
  const badgeY = currentY + 4;
  const badgeHeight = 24;

  doc.setFillColor(...BRAND.primary);
  doc.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('OPERATOR NET EARNINGS', badgeX + (badgeWidth / 2), badgeY + 7, { align: 'center' });

  const netText = formatCurrencyPdf(record.netEarnings || 0);
  doc.setFont('helvetica', 'bold');
  // Auto scale font size if amount is large so it stays completely inside
  doc.setFontSize(netText.length > 12 ? 11 : 13);
  doc.text(netText, badgeX + (badgeWidth / 2), badgeY + 18, { align: 'center' });

  currentY += summaryBoxHeight + 14;

  // 6. Signatures & Confirmation
  doc.setTextColor(...BRAND.darkText);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const signLineW = 55;
  doc.line(marginX + 6, currentY + 12, marginX + 6 + signLineW, currentY + 12);
  doc.text('Customer Signature', marginX + 12, currentY + 18);

  doc.line(pageWidth - marginX - signLineW - 6, currentY + 12, pageWidth - marginX - 6, currentY + 12);
  doc.text('Tractor Operator Signature', pageWidth - marginX - signLineW - 2, currentY + 18);

  // 7. Footer
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.mutedText);
  doc.text(
    'TRACULATOR • Tractor Work Time & Earnings Management System • Generated Digitally',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  // File Download Name
  const cleanName = (record.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Traculator_Bill_${cleanName}_${record.date || '2026'}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads an executive Monthly Tractor Work & Financial Report PDF.
 * @param {string} monthYear - e.g. "August 2026"
 * @param {Object} summary - { totalCustomers, totalSeconds, totalIncome, totalExpenses, netEarnings }
 * @param {Array} jobs - List of completed jobs in this month
 */
export function generateMonthlyReportPDF(monthYear, summary, jobs = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 15;

  // 1. Header Banner
  doc.setFillColor(...BRAND.primary);
  doc.rect(marginX, currentY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('TRACULATOR', marginX + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Track Time. Calculate Earnings.', marginX + 6, currentY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MONTHLY TRACTOR REPORT', pageWidth - marginX - 6, currentY + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Period: ${monthYear}`, pageWidth - marginX - 6, currentY + 16, { align: 'right' });

  currentY += 28;

  // 2. Executive Financial Summary Cards (5 KPIs)
  const cardWidth3 = (contentWidth - 6) / 3;
  const cardHeight = 22;

  const kpisRow1 = [
    { label: 'Total Customers', val: String(summary.totalCustomers || 0) },
    { label: 'Total Working Time', val: formatDuration(summary.totalSeconds || 0, 'short') },
    { label: 'Total Income', val: formatCurrencyPdf(summary.totalIncome || 0) },
  ];

  kpisRow1.forEach((kpi, idx) => {
    const x = marginX + idx * (cardWidth3 + 3);
    doc.setFillColor(...BRAND.bgLight);
    doc.setDrawColor(...BRAND.border);
    doc.rect(x, currentY, cardWidth3, cardHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BRAND.mutedText);
    doc.text(kpi.label, x + 4, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...BRAND.primary);
    doc.text(kpi.val, x + 4, currentY + 16);
  });

  currentY += cardHeight + 4;

  const cardWidth2 = (contentWidth - 4) / 2;
  const kpisRow2 = [
    { label: 'Total Operating Expenses', val: formatCurrencyPdf(summary.totalExpenses || 0), isExpense: true },
    { label: 'Net Operator Earnings', val: formatCurrencyPdf(summary.netEarnings || 0), isNet: true },
  ];

  kpisRow2.forEach((kpi, idx) => {
    const x = marginX + idx * (cardWidth2 + 4);
    if (kpi.isNet) {
      doc.setFillColor(...BRAND.primary);
      doc.rect(x, currentY, cardWidth2, cardHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(kpi.label, x + 4, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.text(kpi.val, x + 4, currentY + 16);
    } else {
      doc.setFillColor(...BRAND.bgLight);
      doc.setDrawColor(...BRAND.border);
      doc.rect(x, currentY, cardWidth2, cardHeight, 'FD');
      doc.setTextColor(...BRAND.mutedText);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(kpi.label, x + 4, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...BRAND.redText);
      doc.text(kpi.val, x + 4, currentY + 16);
    }
  });

  currentY += cardHeight + 8;

  // 3. Detailed Itemized Work Jobs Table
  const tableRows = jobs.map((job, idx) => {
    const jobMins = Math.round(((job.durationSeconds || 0) / 60) * 10) / 10;
    return [
      idx + 1,
      job.date ? formatDate(job.date).replace(/Today, |Yesterday, /, '') : '--',
      job.customerName || 'Customer',
      job.location || job.address || '--',
      `${jobMins}m`,
      `Rs.${job.ratePerMinute}`,
      formatCurrencyPdf(job.workAmount),
      formatCurrencyPdf(job.totalExpenses || 0),
      formatCurrencyPdf(job.netEarnings || 0),
    ];
  });

  doc.autoTable({
    startY: currentY,
    margin: { left: marginX, right: marginX },
    tableWidth: contentWidth,
    head: [['#', 'DATE', 'CUSTOMER', 'FIELD LOCATION', 'TIME', 'RATE', 'INCOME', 'EXPENSES', 'NET']],
    body: tableRows.length > 0 ? tableRows : [['-', '-', 'No completed work records for this month', '-', '-', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 2,
    },
    bodyStyles: {
      textColor: BRAND.darkText,
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 32, halign: 'left', fontStyle: 'bold' },
      3: { cellWidth: 34, halign: 'left' },
      4: { cellWidth: 14 },
      5: { cellWidth: 16 },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 18, halign: 'right', textColor: BRAND.redText },
      8: { cellWidth: 22, halign: 'right', fontStyle: 'bold', textColor: BRAND.primary },
    },
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.mutedText);
    doc.text(
      `TRACULATOR • Monthly Business Report • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      288,
      { align: 'center' }
    );
  }

  const cleanMonth = monthYear.replace(/\s+/g, '_');
  doc.save(`Traculator_Monthly_Report_${cleanMonth}.pdf`);
}
