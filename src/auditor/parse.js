export function parseGapCSV(text) {
  if (!text) return { headers: [], rows: [], errors: [] };
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  const errors = [];
  let lineNum = 1;
  let current = [];
  let field = '';
  let i = 0;
  let inQuoted = false;
  let quoteSeen = false;
  let rowStartLine = 1;
  while (i < text.length) {
    const ch = text[i];
    if (quoteSeen) {
      if (ch === '"') {
        field += '"';
        quoteSeen = false;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
        inQuoted = false;
        quoteSeen = false;
      } else if (ch === '\r') {
        current.push(field.trim());
        rows.push(current);
        current = [];
        field = '';
        inQuoted = false;
        quoteSeen = false;
        lineNum++;
        if (i + 1 < text.length && text[i + 1] === '\n') i++;
      } else if (ch === '\n') {
        current.push(field.trim());
        rows.push(current);
        current = [];
        field = '';
        inQuoted = false;
        quoteSeen = false;
        lineNum++;
      } else {
        inQuoted = true;
        quoteSeen = false;
        field += ch;
      }
    } else if (inQuoted) {
      if (ch === '"') {
        quoteSeen = true;
      } else {
        field += ch;
      }
    } else {
      if (field.length === 0 && ch === '"') {
        inQuoted = true;
      } else if (ch === ',') {
        current.push(field.trim());
        field = '';
      } else if (ch === '\r') {
        current.push(field.trim());
        if (current.length > 0 && current.some(f => f !== '')) rows.push(current);
        else if (current.length > 0) errors.push({ line: rowStartLine, reason: 'empty row' });
        current = [];
        field = '';
        lineNum++;
        rowStartLine = lineNum;
        if (i + 1 < text.length && text[i + 1] === '\n') i++;
      } else if (ch === '\n') {
        current.push(field.trim());
        if (current.length > 0 && current.some(f => f !== '')) rows.push(current);
        else if (current.length > 0) errors.push({ line: rowStartLine, reason: 'empty row' });
        current = [];
        field = '';
        lineNum++;
        rowStartLine = lineNum;
      } else {
        field += ch;
      }
    }
    i++;
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field.trim());
    if (current.length > 0 && current.some(f => f !== '')) rows.push(current);
    else if (current.length > 0) errors.push({ line: rowStartLine, reason: 'empty row' });
  }
  if (rows.length === 0) return { headers: [], rows: [], errors };
  const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
  rows.forEach((r, idx) => {
    const origLen = r.length;
    while (r.length < maxCols) r.push('');
    if (origLen < maxCols) errors.push({ line: idx + 1, reason: `short row (${origLen}/${maxCols} columns)` });
  });
  return { headers: rows[0], rows: rows.slice(1), errors };
}

export function dedupHeaders(headers) {
  const seen = {};
  let duped = 0;
  const result = headers.map(h => {
    if (!h) h = '';
    if (seen[h] !== undefined) {
      duped++;
      seen[h]++;
      return h + ' (' + seen[h] + ')';
    }
    seen[h] = 1;
    return h;
  });
  return { headers: result, duped };
}
