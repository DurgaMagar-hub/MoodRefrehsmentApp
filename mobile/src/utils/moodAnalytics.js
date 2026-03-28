/**
 * Client-side mood intelligence (heuristic — swap for LLM / server later).
 */

const DISTRESS_LABELS = new Set(['Gloomy', 'Anxious', 'Angry', 'Stressed']);

export function isDistressMood(mood) {
    if (!mood) return false;
    const label = mood.label || '';
    return DISTRESS_LABELS.has(label) || (mood.energy !== undefined && Number(mood.energy) <= 22);
}

export function moodEntriesByDay(entries) {
    const map = new Map();
    for (const e of entries || []) {
        const d = (e.createdAt || '').slice(0, 10);
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
        const d = (e.createdAt || '').slice(0, 10);
        if (d) days.add(d);
    }

    const toKey = (date) => date.toISOString().slice(0, 10);
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
            const a = new Date(prev + 'T12:00:00');
            const b = new Date(d + 'T12:00:00');
            const diff = Math.round((b - a) / 86400000);
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
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        week.push({ date: fmt(d), count: 0, avgEnergy: 0, entries: [] });
    }

    for (const e of entries || []) {
        const day = (e.createdAt || '').slice(0, 10);
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
    const energies = (entries || [])
        .filter((e) => {
            const d = (e.createdAt || '').slice(0, 10);
            return week.some((w) => w.date === d);
        })
        .map((e) => Number(e.energy) || 50);
    const avgEnergy = energies.length ? Math.round(energies.reduce((a, b) => a + b, 0) / energies.length) : null;

    return { week, totalLogs, avgEnergy };
}

export function generateInsightMessages(entries) {
    const streak = computeStreak(entries);
    const weekly = computeWeeklySummary(entries);
    const lines = [];

    if (streak.current >= 7) {
        lines.push(`You've checked in ${streak.current} days in a row — that consistency rewires the brain toward self-awareness.`);
    } else if (streak.current >= 3) {
        lines.push(`A ${streak.current}-day streak is forming. Small repeats beat perfect plans.`);
    } else if (entries?.length >= 1) {
        lines.push('Logging today already puts you ahead of most people who only think about tracking.');
    }

    if (weekly.avgEnergy != null) {
        if (weekly.avgEnergy >= 70) {
            lines.push('This week your energy has run high — channel it, but watch for crash days.');
        } else if (weekly.avgEnergy <= 35) {
            lines.push('Energy has been gentle this week — prioritize rest, sunlight, and micro-wins.');
        } else {
            lines.push('Your energy has been in a balanced range — a good moment to notice what helps vs drains.');
        }
    }

    if (entries?.length >= 5) {
        const recent = entries.slice(0, 5);
        const labels = recent.map((e) => e.label || e.mood).filter(Boolean);
        const uniq = new Set(labels);
        if (uniq.size === 1) {
            lines.push(`Your last few check-ins lean toward "${[...uniq][0]}". If that feels stuck, try one opposite action today (move, reach out, or breathe).`);
        }
    }

    if (!lines.length) {
        lines.push('Check in a few times this week to unlock personalized patterns.');
    }

    return { headline: lines[0], supporting: lines.slice(1, 3) };
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

/** Local "AI summary" for journal — replace with model API when ready. */
export function summarizeJournalText(text) {
    const t = (text || '').trim();
    if (!t) return '';
    const first = t.split(/\n+/)[0];
    const clip = first.length > 160 ? `${first.slice(0, 157)}…` : first;
    const words = t.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const freq = {};
    for (const w of words) {
        freq[w] = (freq[w] || 0) + 1;
    }
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    const themeHint = top ? ` Themes circling "${top[0]}".` : '';
    return `Summary: ${clip}${themeHint}`;
}
