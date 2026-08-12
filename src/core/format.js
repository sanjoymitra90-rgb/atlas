export function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function csvCell(v) {
  const s = String(v ?? '');
  const guarded = /^[=+\-@\t\r]/.test(s) && !/^[+-]\d/.test(s) ? "'" + s : s;
  return '"' + guarded.replace(/"/g, '""') + '"';
}

export function formatMoney(amount) {
  return '$' + amount.toLocaleString('en-US');
}
