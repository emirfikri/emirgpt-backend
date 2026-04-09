import { Venue } from "@/core/booking/model/venue";

export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        "Content-Type": "application/json",
    };
}

export function getCurrentDate() {
    return new Date;
}

const MALAYSIA_OFFSET_HOURS = 8;
const WEEKDAY_INDEX: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};


// For AI prompt context
// this to stamdardize the Malaysia date/time context for the AI to refer to when parsing user input
export function getMalaysiaNow(date: Date) {
    return new Date(date.getTime() + MALAYSIA_OFFSET_HOURS * 60 * 60 * 1000);
}

export function buildUtcDateFromMalaysiaParts(year: number, month: number, day: number, hour: number, minute: number) {
    return new Date(Date.UTC(year, month - 1, day, hour - MALAYSIA_OFFSET_HOURS, minute, 0, 0));
}

export function addMalaysiaDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setUTCDate(nextDate.getUTCDate() + days);
    return nextDate;
}

export function parseRequestedTime(message: string) {
    // Handle time ranges like "8-9pm", "8–9pm", "8.30-9.30pm" — always take the START time
    const rangeMatch = message.match(/\b(\d{1,2})(?:[:.](\d{2}))?[\s]*[-–—][\s]*\d{1,2}(?:[:.](\d{2}))?\s*(am|pm)\b/i);
    if (rangeMatch) {
        const hourValue = Number(rangeMatch[1]);
        const minuteValue = Number(rangeMatch[2] || '0');
        const period = rangeMatch[4].toLowerCase();
        let hour = hourValue % 12;
        if (period === 'pm') hour += 12;
        return { hour, minute: minuteValue };
    }

    const amPmMatch = message.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/i);
    if (amPmMatch) {
        const hourValue = Number(amPmMatch[1]);
        const minuteValue = Number(amPmMatch[2] || '0');
        const period = amPmMatch[3].toLowerCase();

        let hour = hourValue % 12;
        if (period === 'pm') {
            hour += 12;
        }

        return { hour, minute: minuteValue };
    }

    const twentyFourHourMatch = message.match(/\b([01]?\d|2[0-3]):(\d{2})\b/);
    if (twentyFourHourMatch) {
        return {
            hour: Number(twentyFourHourMatch[1]),
            minute: Number(twentyFourHourMatch[2]),
        };
    }

    return null;
}

export function parseRequestedMalaysiaDate(message: string, now: Date) {
    const malaysiaNow = getMalaysiaNow(now);
    const lowerMessage = message.toLowerCase();

    const exactDateMatch = lowerMessage.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (exactDateMatch) {
        return {
            year: Number(exactDateMatch[1]),
            month: Number(exactDateMatch[2]),
            day: Number(exactDateMatch[3]),
        };
    }

    if (/\b(today|now)\b/.test(lowerMessage)) {
        return {
            year: malaysiaNow.getUTCFullYear(),
            month: malaysiaNow.getUTCMonth() + 1,
            day: malaysiaNow.getUTCDate(),
        };
    }

    if (/\btomorrow\b/.test(lowerMessage)) {
        const tomorrow = addMalaysiaDays(malaysiaNow, 1);
        return {
            year: tomorrow.getUTCFullYear(),
            month: tomorrow.getUTCMonth() + 1,
            day: tomorrow.getUTCDate(),
        };
    }

    for (const [weekdayName, weekdayIndex] of Object.entries(WEEKDAY_INDEX)) {
        if (new RegExp(`\\b(?:next\\s+)?${weekdayName}\\b`, 'i').test(lowerMessage)) {
            const currentWeekday = malaysiaNow.getUTCDay();
            const daysAhead = ((weekdayIndex - currentWeekday + 7) % 7) || 7;
            const requestedDate = addMalaysiaDays(malaysiaNow, daysAhead);

            return {
                year: requestedDate.getUTCFullYear(),
                month: requestedDate.getUTCMonth() + 1,
                day: requestedDate.getUTCDate(),
            };
        }
    }

    return null;
}


// for Venues checking, to standardize the user input for
//  better matching with venue names/tags in the database
export function normalizeText(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function escapeRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// a simple bigram matching score to determine if the user explicitly mentioned a venue in their message,
//  by checking for presence of consecutive word pairs from the venue name in the user message.
//  This is to give higher priority to user explicitly mentioning a venue,
//  than just relying on AI suggested venueId which can be noisy and less accurate.
function bigramScore(normalizedMessage: string, venue: Venue): number {
    const words = normalizeText(venue.name).split(' ');
    let score = 0;
    for (let i = 0; i < words.length - 1; i++) {
        const pattern = new RegExp(`\\b${escapeRegex(words[i])}\\s+${escapeRegex(words[i + 1])}\\b`);
        if (pattern.test(normalizedMessage)) score++;
    }
    return score;
}

export function getExplicitlyRequestedVenues(message: string, venues: Venue[]) {
    const normalizedMessage = normalizeText(message);
    const scored = venues.map(venue => ({ venue, score: bigramScore(normalizedMessage, venue) }));
    const maxScore = Math.max(...scored.map(s => s.score));
    if (maxScore === 0) return [];
    return scored.filter(s => s.score === maxScore).map(s => s.venue);
}

export function userSpecifiedVenue(message: string, venues: Venue[]) {
    return getExplicitlyRequestedVenues(message, venues).length > 0;
}

export function getSportMatchedVenues(venues: Venue[], sport: string | undefined) {
    if (!sport) {
        return [];
    }

    const normalizedSport = normalizeText(sport);
    return venues.filter((venue) => {
        const name = normalizeText(venue.name);
        const type = normalizeText(venue.type);
        const tags = venue.tags.map(normalizeText);

        return name.includes(normalizedSport)
            || type.includes(normalizedSport)
            || tags.some((tag) => tag.includes(normalizedSport) || normalizedSport.includes(tag));
    });
}