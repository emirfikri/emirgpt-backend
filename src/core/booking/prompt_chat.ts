import { Venue } from "@/core/booking/model/venue";

function getMalaysiaDateContext(today: Date) {
  const malaysiaNow = new Date(today.getTime() + 8 * 60 * 60 * 1000);
  const malaysiaDate = malaysiaNow.toISOString().slice(0, 10);
  const malaysiaTime = malaysiaNow.toISOString().slice(11, 16);
  const malaysiaDay = malaysiaNow.getUTCDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return {
    malaysiaDate,
    malaysiaTime,
    malaysiaDay,
    malaysiaDayName: dayNames[malaysiaDay],
    malaysiaNowIsoLike: `${malaysiaDate}T${malaysiaTime}:00+08:00`,
  };
}

export function buildBookVenuePrompt(userPrompt: string, venueList: Venue[], today: Date): string {
const { malaysiaDate, malaysiaTime, malaysiaDay, malaysiaDayName, malaysiaNowIsoLike } = getMalaysiaDateContext(today);
const daysToNextMonday = ((1 - malaysiaDay + 7) % 7) || 7;
const nextMondayMalaysia = new Date(today.getTime() + daysToNextMonday * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000);
const nextMondayDate = nextMondayMalaysia.toISOString().slice(0, 10);

return`
Extract booking details from user input.

Current date and time in UTC: ${today.toISOString()}
Current date and time in Malaysia (UTC+8): ${malaysiaNowIsoLike}
Current Malaysia calendar date: ${malaysiaDate}
Current Malaysia local time: ${malaysiaTime}
Current Malaysia day of week: ${malaysiaDay} (${malaysiaDayName})

Instructions:
- User is based on Malaysia timezone (UTC+8). Resolve the requested date/time in Malaysia timezone first, then convert and return ISO 8601 (UTC).
- Booking can only be made for current Month
- If the user says 'today', use today's Malaysia calendar date ${malaysiaDate}.
- If the user says 'now', use the current Malaysia local time context ${malaysiaTime}.
- If the user says 'tomorrow', use today + 1 calendar day in Malaysia timezone.
- If the user says a weekday (e.g., 'Monday') or 'next Monday', use the next occurrence strictly after today.
- If the user gives an exact date (e.g., '2026-07-01'), use that exact calendar date.
- If the user gives an explicit time such as '6pm', '18:00', or '8.30pm', preserve that exact Malaysia local time. Do not replace it with the current clock time.
- If the user says 'today 6pm', the booking must be on ${malaysiaDate} at 18:00 Malaysia time, which is 10:00:00Z in UTC.
- Validation rule: if user requested a weekday, startDate must match that weekday. If not, recompute before returning JSON.
- Validation rule: if user requested an explicit time, startDate must match that exact requested time in Malaysia timezone.

Reference example from current context:
- Current Malaysia day is ${malaysiaDay} (${malaysiaDayName}). "next Monday" must be ${nextMondayDate} in Malaysia calendar date.

The user wants to book a sports venue. Extract the following details from the user's input:
Input: "${userPrompt}"

Here are the details of the available venues:
${venueList.map(venue => `- ${venue.id} ${venue.name}, ${venue.tags.join(', ')} (${venue.type}) at ${venue.address}, $${venue.pricePerHour}/hour`).join('\n')}

Output JSON:
{
  intent: "book" | "cancel" | "faq" | "other",
  sport,
  startDate, (always in ISO 8601, UTC)
  endDate (always 1 hour after startDate), (ISO 8601, UTC)
  time,
  venueId: string[] (- list of all venue IDs that match the user's sports request; if user specifies a specific venue, list only that venueId; - if no venue is available, return empty array),
  venueName: string[] (list of all matching venue names),
  pricePerHour:number[],
  reply: string,
}
`
;
}
