function invalid() {
  return Object.assign(new Error('The LoyalFans timestamp is missing or malformed.'), { code: 'INVALID_LOYALFANS_TIMESTAMP' });
}

function parts(date, formatter) {
  return Object.fromEntries(formatter.formatToParts(date).filter(p => p.type !== 'literal')
    .map(p => [p.type, Number(p.value)]));
}

/** Canonical UTC ISO timestamps; never uses the server's local timezone for wire objects. */
export function normalizeLoyalFansTimestamp(value, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) throw invalid();
    return null;
  }
  if (typeof value === 'string') {
    // Existing ISO strings must describe an instant, rather than depend on host timezone.
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) throw invalid();
    if (Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59 || Number(value.slice(17, 19)) > 59) throw invalid();
    const parsed = new Date(value);
    const day = value.slice(0, 10);
    const calendar = new Date(`${day}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== day) throw invalid();
    return parsed.toISOString();
  }
  if (typeof value !== 'object' || Array.isArray(value) ||
      !['date', 'timezone_type', 'timezone'].every(key => Object.hasOwn(value, key)) ||
      typeof value.date !== 'string' || typeof value.timezone !== 'string' ||
      !value.timezone || value.timezone.length > 100 || ![1, 3].includes(value.timezone_type)) throw invalid();
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/.exec(value.date);
  if (!match) throw invalid();
  const [, year, month, day, hour, minute, second, fraction = ''] = match;
  const isoLocal = `${year}-${month}-${day}T${hour}:${minute}:${second}.${`${fraction}000`.slice(0, 3)}Z`;
  const local = new Date(isoLocal);
  if (!Number.isFinite(local.getTime()) || local.toISOString() !== isoLocal) throw invalid();
  if (value.timezone_type === 1) {
    const offset = /^([+-])(\d{2}):(\d{2})$/.exec(value.timezone);
    if (!offset || Number(offset[2]) > 23 || Number(offset[3]) > 59) throw invalid();
    const minutes = (Number(offset[2]) * 60 + Number(offset[3])) * (offset[1] === '+' ? 1 : -1);
    return new Date(local.getTime() - minutes * 60000).toISOString();
  }
  // IANA zones respect historic/DST offsets. Ambiguous or nonexistent local times fail closed.
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-US', { timeZone: value.timezone, calendar: 'gregory',
      numberingSystem: 'latn', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { throw invalid(); }
  const offsets = new Set();
  const wallTime = (date, p) => { const wall = new Date(date); wall.setUTCFullYear(p.year, p.month - 1, p.day);
    wall.setUTCHours(p.hour, p.minute, p.second, date.getUTCMilliseconds()); return wall.getTime(); };
  for (const delta of [-36, 0, 36]) {
    const sample = new Date(local.getTime() + delta * 3600000);
    offsets.add(wallTime(sample, parts(sample, formatter)) - sample.getTime());
  }
  const matches = [...offsets].map(offset => new Date(local.getTime() - offset))
    .filter(date => wallTime(date, parts(date, formatter)) === local.getTime());
  if (matches.length !== 1) throw invalid();
  return matches[0].toISOString();
}
