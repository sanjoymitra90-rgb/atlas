export function getGapBucketKey(timestamp, interval) {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const min = d.getUTCMinutes();
  if (interval === '1day') return y + '-' + m + '-' + day;
  if (interval === '1hour') return y + '-' + m + '-' + day + 'T' + h;
  if (interval === '5min') return y + '-' + m + '-' + day + 'T' + h + ':' + String(Math.floor(min / 5) * 5).padStart(2, '0');
  if (interval === '1min') return y + '-' + m + '-' + day + 'T' + h + ':' + String(min).padStart(2, '0');
  return y + '-' + m + '-' + day + 'T' + h;
}

export function getAutoBucketInterval(minTime, maxTime) {
  const rangeMs = maxTime - minTime;
  const hourMs = 3600000;
  if (rangeMs <= hourMs) return '1min';
  if (rangeMs <= 6 * hourMs) return '5min';
  if (rangeMs <= 3 * 24 * hourMs) return '1hour';
  return '1day';
}

export function formatBucketLabel(key, interval) {
  if (interval === '1day') {
    const d = new Date(key + 'T00:00:00Z');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getUTCMonth()] + ' ' + d.getUTCDate();
  }
  if (interval === '1hour') {
    const d = new Date(key + ':00:00Z');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCHours() + ':00';
  }
  if (interval === '5min' || interval === '1min') {
    const parts = key.split('T');
    const timeParts = parts[1].split(':');
    let h = parseInt(timeParts[0], 10);
    const min = timeParts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + min + ' ' + ampm;
  }
  return key;
}
