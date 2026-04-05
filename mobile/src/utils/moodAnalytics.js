/**
 * Client-side mood intelligence (heuristic — swap for LLM / server later).
 */

import { toLocalCalendarDateKey, localDateKeyFromDate, localNoonFromDateKey } from './deviceTime';

const DISTRESS_LABELS = new Set(['Gloomy', 'Anxious', 'Angry', 'Stressed']);

export function isDistressMood(mood) {
    if (!mood) return false;
    const label = mood.label || '';
    return DISTRESS_LABELS.has(label) || (mood.energy !== undefined && Number(mood.energy) <= 22);
}

export function moodEntriesByDay(entries) {
    const map = new Map();
    for (const e of entries || []) {
        const d = toLocalCalendarDateKey(e.createdAt);
        if (!d) continue;
        if (!map.has(d)) map.set(d, []);
        map.get(d).push(e);
    }
    return map;
}

export function computeStreak(entries) {
    if (!entries?.length) return { current: 0, longest: 0, lastCheckInDate: null };

    const days = new Set();
    for (const e of entries) {
        const d = toLocalCalendarDateKey(e.createdAt);
        if (d) days.add(d);
    }

    const toKey = (date) => localDateKeyFromDate(date);
    const today = new Date();

    let current = 0;
    let cursor = new Date(today);
    if (!days.has(toKey(cursor))) {
        cursor.setDate(cursor.getDate() - 1);
    }
    while (days.has(toKey(cursor))) {
        current++;
        cursor.setDate(cursor.getDate() - 1);
    }

    let longest = 0;
    let run = 0;
    let prev = null;
    for (const d of [...days].sort()) {
        if (!prev) run = 1;
        else {
            const a = localNoonFromDateKey(prev);
            const b = localNoonFromDateKey(d);
            const diff = a && b ? Math.round((b - a) / 86400000) : 999;
            run = diff === 1 ? run + 1 : 1;
        }
        longest = Math.max(longest, run);
        prev = d;
    }

    const lastCheckInDate = [...days].sort().reverse()[0] || null;
    return { current, longest, lastCheckInDate };
}

export function computeWeeklySummary(entries) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    const fmt = (dt) => localDateKeyFromDate(dt);
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        week.push({ date: fmt(d), count: 0, avgEnergy: 0, entries: [] });
    }

    for (const e of entries || []) {
        const day = toLocalCalendarDateKey(e.createdAt);
        const bucket = week.find((w) => w.date === day);
        if (bucket) {
            bucket.count++;
            bucket.entries.push(e);
        }
    }
    for (const w of week) {
        if (w.entries.length) {
            const sum = w.entries.reduce((s, x) => s + (Number(x.energy) || 50), 0);
            w.avgEnergy = Math.round(sum / w.entries.length);
        }
    }
    const totalLogs = week.reduce((s, w) => s + w.count, 0);
    const windowed = (entries || [])
        .filter((e) => {
            const d = toLocalCalendarDateKey(e.createdAt);
            return week.some((w) => w.date === d);
        });

    const energies = windowed.map((e) => Number(e.energy) || 50);
    const avgEnergy = energies.length ? Math.round(energies.reduce((a, b) => a + b, 0) / energies.length) : null;

    const stresses = windowed.map((e) => (e.stress === null || e.stress === undefined ? null : Number(e.stress))).filter((x) => Number.isFinite(x));
    const sleeps = windowed.map((e) => (e.sleep === null || e.sleep === undefined ? null : Number(e.sleep))).filter((x) => Number.isFinite(x));
    const avgStress = stresses.length ? Math.round(stresses.reduce((a, b) => a + b, 0) / stresses.length) : null;
    const avgSleep = sleeps.length ? Math.round(sleeps.reduce((a, b) => a + b, 0) / sleeps.length) : null;

    return { week, totalLogs, avgEnergy, avgStress, avgSleep };
}

export function computeBadges(streak, totalMoods, journalCount) {
    const badges = [];
    if (streak.current >= 1) badges.push({ id: 'first-light', title: 'First Light', desc: 'Started your journey' });
    if (streak.current >= 3) badges.push({ id: 'three-sunrise', title: 'Three Sunrises', desc: '3-day check-in streak' });
    if (streak.current >= 7) badges.push({ id: 'week-warrior', title: 'Week Warrior', desc: '7-day streak' });
    if (streak.current >= 30) badges.push({ id: 'month-mastery', title: 'Steady Soul', desc: '30-day streak' });
    if (totalMoods >= 10) badges.push({ id: 'scribe-10', title: 'Mood Mapper', desc: '10 mood logs' });
    if (totalMoods >= 50) badges.push({ id: 'scribe-50', title: 'Pattern Seeker', desc: '50 mood logs' });
    if (journalCount >= 3) badges.push({ id: 'journal-3', title: 'Inner Voice', desc: '3 journal entries' });
    return badges;
}
