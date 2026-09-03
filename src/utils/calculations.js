/**
 * Financial and Duration Calculations for TRACULATOR
 * Designed for precise agricultural tractor operation billing.
 */

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
