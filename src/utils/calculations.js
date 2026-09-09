/**
 * Auto-format Date input to DD/MM/YYYY while typing.
 * Auto-inserts '/' after DD and MM.
 * @param {string} val 
 * @param {string} prevVal 
 * @returns {string}
 */
export function formatDateInput(val = '', prevVal = '') {
  let digits = String(val).replace(/\D/g, '').slice(0, 8);
  const isDeleting = prevVal && val.length < prevVal.length;

  if (isDeleting) {
    if (prevVal.endsWith('/') && val === prevVal.slice(0, -1)) {
      digits = digits.slice(0, -1);
    }
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  // Forward typing: 22 -> 22/ -> 22/03 -> 22/03/2026
  if (digits.length === 2) {
    return `${digits}/`;
  }
  if (digits.length === 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  return digits;
}

/**
 * Auto-format Time input to HH:MM:SS or HH:MM:SS:MS while typing.
 * Auto-inserts ':' after HH (e.g. 10 -> 10:).
 * After minutes are entered (e.g. 10:30), does NOT show a trailing ':'.
 * Shows the next ':' only when the user actually starts typing seconds (e.g. 10:30:0 -> 10:30:05).
 * @param {string} val 
 * @param {string} prevVal 
 * @returns {string}
 */
export function formatTimeInput(val = '', prevVal = '') {
  let digits = String(val).replace(/\D/g, '').slice(0, 9);
  const isDeleting = prevVal && val.length < prevVal.length;

  if (isDeleting) {
    if (prevVal.endsWith(':') && val === prevVal.slice(0, -1)) {
      digits = digits.slice(0, -1);
    }
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    if (digits.length <= 6) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4, 6)}:${digits.slice(6)}`;
  }

  // Forward typing:
  // 1. Hours entered (2 digits): 10 -> 10:
  if (digits.length === 2) {
    return `${digits}:`;
  }
  // 2. Typing minutes (3 digits): 103 -> 10:3
  if (digits.length === 3) {
    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }
  // 3. Minutes completed (4 digits): 1030 -> 10:30 (NO trailing colon!)
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
  // 4. Starts typing seconds (5 digits): 10300 -> 10:30:0 (colon added before seconds)
  if (digits.length === 5) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4)}`;
  }
  // 5. Seconds completed (6 digits): 103005 -> 10:30:05 (NO trailing colon!)
  if (digits.length === 6) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4, 6)}`;
  }
  // 6. Milliseconds entered (>6 digits): 1030055 -> 10:30:05:5 ... 10:30:05:500
  if (digits.length > 6) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4, 6)}:${digits.slice(6)}`;
  }
  return digits;
}

/**
 * Formats a Date object into DD/MM/YYYY string
 * @param {Date} dateObj 
 * @returns {string}
 */
export function formatDateToDDMMYYYY(dateObj = new Date()) {
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a Date object into HH:MM:SS string
 * @param {Date} dateObj 
 * @param {boolean} includeSeconds 
 * @returns {string}
 */
export function formatTimeToHHMMSS(dateObj = new Date(), includeSeconds = true) {
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
}

/**
 * Parses DD/MM/YYYY date and HH:MM:SS / HH:MM:SS:MS time into a Date object.
 * @param {string} dateStr DD/MM/YYYY or YYYY-MM-DD
 * @param {string} timeStr HH:MM, HH:MM:SS, or HH:MM:SS:MS
 * @returns {Date|null}
 */
export function parseDateAndTimeToDate(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;

  let day, month, year;
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else {
    return null;
  }

  if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) return null;

  const tParts = timeStr.split(':');
  const hours = parseInt(tParts[0] || '0', 10);
  const minutes = parseInt(tParts[1] || '0', 10);
  const seconds = parseInt(tParts[2] || '0', 10);
  let ms = 0;
  if (tParts[3]) {
    const msStr = tParts[3].padEnd(3, '0').slice(0, 3);
    ms = parseInt(msStr, 10) || 0;
  }

  const d = new Date(year, month - 1, day, hours, minutes, seconds, ms);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculates work amount based on rate per minute and duration in seconds.
 * Formula: Rate Per Minute × Actual Working Minutes (durationSeconds / 60)
 * @param {number} ratePerMinute Rate charged in ₹ per minute
 * @param {number} durationSeconds Total actual work duration in seconds
 * @returns {number} Work amount in ₹
 */
export function calculateWorkAmount(ratePerMinute, durationSeconds) {
  const rate = Number(ratePerMinute) || 0;
  const seconds = Math.max(0, Number(durationSeconds) || 0);
  const minutes = seconds / 60;
  return Math.round(rate * minutes * 100) / 100;
}

/**
 * Calculates duration in seconds between two date/time strings or Date objects.
 * @param {string|Date} startDateTime 
 * @param {string|Date} endDateTime 
 * @returns {number} Duration in seconds
 */
export function calculateDurationBetweenDates(startDateTime, endDateTime) {
  if (!startDateTime || !endDateTime) return 0;
  const start = new Date(startDateTime).getTime();
  const end = new Date(endDateTime).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  return Math.floor((end - start) / 1000);
}

/**
 * Calculates and formats working hours between two dates/times.
 * @param {string|Date} startDateTime 
 * @param {string|Date} endDateTime 
 * @returns {{ seconds: number, minutes: number, hours: number, decimalHours: string, formatted: string }}
 */
export function calculateWorkingHours(startDateTime, endDateTime) {
  const seconds = calculateDurationBetweenDates(startDateTime, endDateTime);
  const minutes = Math.round((seconds / 60) * 10) / 10;
  const hours = Math.round((seconds / 3600) * 100) / 100;
  const formatted = formatDuration(seconds, 'long');
  return {
    seconds,
    minutes,
    hours,
    decimalHours: hours.toFixed(2),
    formatted,
  };
}

/**
 * Calculates total expenses from itemized categories.
 * @param {Object} expenses - { diesel, driver, food, other }
 * @returns {number}
 */
export function calculateTotalExpenses(expenses = {}) {
  const diesel = Number(expenses.diesel) || 0;
  const driver = Number(expenses.driver) || 0;
  const food = Number(expenses.food) || 0;
  const other = Number(expenses.other) || 0;
  return diesel + driver + food + other;
}

/**
 * Calculates net earnings.
 * Formula: Net Earnings = Total Work Amount - Total Expenses
 * @param {number} totalAmount 
 * @param {number|Object} expenses 
 * @returns {number}
 */
export function calculateNetEarnings(totalAmount, expenses) {
  const amount = Number(totalAmount) || 0;
  const totalExp = typeof expenses === 'object' ? calculateTotalExpenses(expenses) : (Number(expenses) || 0);
  return amount - totalExp;
}

/**
 * Formats a number into Indian Rupee format (e.g., ₹1,450 or ₹1,450.50)
 * Always uses the Indian Rupee symbol (₹).
 * @param {number} amount 
 * @param {boolean} includeDecimals 
 * @returns {string}
 */
export function formatCurrency(amount, includeDecimals = false) {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
  return `₹${formatted}`;
}

/**
 * Formats currency for PDF export with clean bounding and font compatibility.
 * @param {number} amount 
 * @param {boolean} includeDecimals 
 * @returns {string}
 */
export function formatCurrencyPdf(amount, includeDecimals = false) {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
  return `Rs. ${formatted}`;
}

/**
 * Formats seconds into human-readable duration strings
 * @param {number} seconds 
 * @param {'short'|'long'|'digital'} style 
 * @returns {string}
 */
export function formatDuration(seconds, style = 'short') {
  const sec = Math.max(0, Math.floor(Number(seconds) || 0));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;

  if (style === 'digital') {
    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(remainingSecs)}`;
    }
    return `${pad(mins)}:${pad(remainingSecs)}`;
  }

  if (style === 'long') {
    const parts = [];
    if (hrs > 0) parts.push(`${hrs} hr${hrs > 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);
    if (remainingSecs > 0 || parts.length === 0) parts.push(`${remainingSecs} sec`);
    return parts.join(' ');
  }

  // default 'short'
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${remainingSecs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${remainingSecs}s`;
  }
  return `${remainingSecs}s`;
}

/**
 * Converts seconds into total minutes (e.g. 90 secs = 1.5 mins)
 * @param {number} seconds 
 * @returns {number}
 */
export function secondsToMinutes(seconds) {
  const sec = Math.max(0, Number(seconds) || 0);
  return Math.round((sec / 60) * 10) / 10;
}

/**
 * Formats a Date or ISO string into a standard readable date string
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function formatDate(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const formatted = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (isToday) return `Today, ${formatted}`;
  if (isYesterday) return `Yesterday, ${formatted}`;
  return formatted;
}

/**
 * Formats a Date or ISO string into a 12-hour time string
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function formatTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Formats a date & time string e.g. "23 Aug 2026, 10:30 AM"
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return `${formatDate(dateInput)}, ${formatTime(dateInput)}`;
}

/**
 * Calculates a customer's overall financial balance and payment history.
 * Formula: Pending Amount = Total Amount - Paid Amount
 * @param {Object|string} customer Customer object or customer ID
 * @param {Array} completedRecords All completed job records
 * @param {Array} payments All payment records
 * @returns {Object} { totalAmount, paidAmount, pendingAmount, netPendingRaw, customerJobs, paymentHistory }
 */
export function calculateCustomerBalance(customer, completedRecords = [], payments = []) {
  if (!customer) {
    return {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      netPendingRaw: 0,
      customerJobs: [],
      paymentHistory: [],
    };
  }

  const custId = typeof customer === 'string' ? customer : (customer.id || '');
  const custName = typeof customer === 'object' ? (customer.customerName || customer.name || '').trim().toLowerCase() : '';
  const custPhone = typeof customer === 'object' ? (customer.mobileNumber || customer.phone || '').trim().replace(/\D/g, '') : '';

  // Filter jobs for this customer
  const customerJobs = (completedRecords || []).filter((job) => {
    if (custId && (job.customerId === custId || job.id === custId)) return true;
    if (custName && (job.customerName || '').trim().toLowerCase() === custName) return true;
    if (custPhone && (job.mobileNumber || '').trim().replace(/\D/g, '') === custPhone && custPhone.length >= 6) return true;
    return false;
  });

  // Filter payments for this customer
  const customerPayments = (payments || []).filter((pay) => {
    if (custId && pay.customerId === custId) return true;
    if (custName && (pay.customerName || '').trim().toLowerCase() === custName) return true;
    if (custPhone && (pay.mobileNumber || '').trim().replace(/\D/g, '') === custPhone && custPhone.length >= 6) return true;
    return false;
  });

  // Total Amount = Sum of all job work amounts
  const totalAmount = customerJobs.reduce((sum, j) => sum + (Number(j.workAmount) || 0), 0);

  // Paid Amount = Sum of all recorded payments
  const paidAmount = customerPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Pending Amount = Total Amount - Paid Amount
  const netPendingRaw = totalAmount - paidAmount;
  const pendingAmount = Math.max(0, netPendingRaw);

  // Sort payments by timestamp / date / createdAt descending
  const paymentHistory = [...customerPayments].sort((a, b) => {
    const timeA = new Date(a.timestamp || a.createdAt || a.date).getTime() || 0;
    const timeB = new Date(b.timestamp || b.createdAt || b.date).getTime() || 0;
    return timeB - timeA;
  });

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    netPendingRaw,
    customerJobs,
    paymentHistory,
  };
}
