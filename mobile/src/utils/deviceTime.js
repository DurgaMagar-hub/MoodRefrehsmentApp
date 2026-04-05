/**
 * Parse API/SQLite timestamps and format using the device's locale and timezone.
 * SQLite DATETIME is UTC; strings like "YYYY-MM-DD HH:MM:SS" are treated as UTC.
 */

export function parseBackendDate(value) {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const s = String(value).trim();
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const m = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/.exec(s);
    if (m) {
        const iso = m[2] != null ? `${m[1]}T${m[2]}:${m[3]}:${m[4]}Z` : `${m[1]}T00:00:00Z`;
        const d = new Date(iso);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** Calendar YYYY-MM-DD in the device's local timezone. */
export function localDateKeyFromDate(dt) {
    if (!dt || Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const mo = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${mo}-${day}`;
}

export function toLocalCalendarDateKey(value) {
    const d = value instanceof Date ? value : parseBackendDate(value);
    if (!d) return '';
    return localDateKeyFromDate(d);
}

/** Local noon for a YYYY-MM-DD key (stable day-difference math). */
export function localNoonFromDateKey(key) {
    if (!key || typeof key !== 'string') return null;
    const parts = key.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
}

export function formatDeviceTime(value, options) {
    const d = parseBackendDate(value);
    if (!d) return '';
    return d.toLocaleTimeString(undefined, options ?? { hour: '2-digit', minute: '2-digit' });
}

export function formatDeviceDate(value, options) {
    const d = parseBackendDate(value);
    if (!d) return '';
    return d.toLocaleDateString(undefined, options ?? { day: '2-digit', month: 'short' });
}

export function formatDeviceDateTime(value, options) {
    const d = parseBackendDate(value);
    if (!d) return '';
    return d.toLocaleString(undefined, options);
}
