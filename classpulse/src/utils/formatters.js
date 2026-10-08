// ─────────────────────────────────────────
//  Formatters — date, currency, text helpers
// ─────────────────────────────────────────

/**
 * Format a YYYY-MM-DD string to "15 Jan 2025"
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format a YYYY-MM string to "January 2025"
 */
export function formatMonth(monthStr) {
  if (!monthStr) return '—';
  try {
    const [year, month] = monthStr.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch {
    return monthStr;
  }
}

/**
 * Format a number as Indian currency: ₹1,500
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

/**
 * Get current date as YYYY-MM-DD
 */
export function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current month as YYYY-MM
 */
export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Return initials from a name: "Vikas T" -> "VT"
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Returns a color based on attendance percentage
 */
export function attendanceColor(pct) {
  if (pct >= 75) return '#00B894'; // good
  if (pct >= 50) return '#FDCB6E'; // warning
  return '#E17055';                 // danger
}
