import { OpenAIClient } from '@/core/ai/openai_client';
import { logger } from '@/core/logging/logger';
import { buildUtcDateFromMalaysiaParts, corsHeaders, getCurrentDate, getMalaysiaNow, getSportMatchedVenues, parseRequestedMalaysiaDate, parseRequestedTime, userSpecifiedVenue } from '../../helper';
import { buildBookVenuePrompt } from '@/core/booking/prompt_chat';
import { checkAvailability, fetchAllVenuesFromFirestore } from '@/core/booking/google_firestore';
import { BookingReplyAi } from '@/core/booking/model/bookingReplyAi';
import { BookingActionPrompt } from '@/core/booking/model/bookingConfirmation';
import { Venue } from '@/core/booking/model/venue';



function normalizeBookingWindow(message: string, now: Date, startDate: Date | string, endDate: Date | string) {
    const requestedDate = parseRequestedMalaysiaDate(message, now);
    const requestedTime = parseRequestedTime(message);

    if (!requestedDate && !requestedTime) {
        return null;
    }

    const aiStartDate = new Date(startDate);
    const malaysiaAiStartDate = getMalaysiaNow(aiStartDate);
    const startHour = requestedTime?.hour ?? malaysiaAiStartDate.getUTCHours();
    const startMinute = requestedTime?.minute ?? malaysiaAiStartDate.getUTCMinutes();
    const year = requestedDate?.year ?? malaysiaAiStartDate.getUTCFullYear();
    const month = requestedDate?.month ?? malaysiaAiStartDate.getUTCMonth() + 1;
    const day = requestedDate?.day ?? malaysiaAiStartDate.getUTCDate();
    const aiEndDate = new Date(endDate);
    const durationMs = aiEndDate.getTime() > aiStartDate.getTime()
        ? aiEndDate.getTime() - aiStartDate.getTime()
        : 60 * 60 * 1000;

    const normalizedStartDate = buildUtcDateFromMalaysiaParts(year, month, day, startHour, startMinute);
    const normalizedEndDate = new Date(normalizedStartDate.getTime() + durationMs);

    return {
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
    };
}



// manual merging logic to combine AI suggested venueId with user explicitly mentioned venue in message, with user preference given higher priority. 
// If user explicitly mentioned a venue, we will only keep the AI suggested venueIds that match the user mentioned venue.
//  If user did not explicitly mention a venue, we will keep all AI suggested venueIds and later use sport matching logic to find venues that match the requested sport.
function mergeVenueCandidates(message: string, replyParsed: BookingReplyAi, venues: Venue[]) {
    const aiVenueIds = Array.isArray(replyParsed.venueId) ? replyParsed.venueId.filter(Boolean) : [];
    const aiVenueIdSet = new Set(aiVenueIds);
    const explicitVenueRequested = userSpecifiedVenue(message, venues);

    if (explicitVenueRequested) {
        return venues.filter((venue) => aiVenueIdSet.has(venue.id));
    }

    const sportMatchedVenues = getSportMatchedVenues(venues, replyParsed.sport);
    if (sportMatchedVenues.length > 0) {
        return sportMatchedVenues;
    }

    return venues.filter((venue) => aiVenueIdSet.has(venue.id));
}


const aiClient = new OpenAIClient();

// Handle preflight (OPTIONS)
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
            headers: corsHeaders(),
    });
}

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: 'Message is required' }),
                {
                    status: 400,
                    headers: corsHeaders(),
                }
            );
        }

        logger.info('AI request received');
        // Fetch venues from Firestore
        const now = new Date();
        const malaysiaNow = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        const day = malaysiaNow.getUTCDay();
        console.log('Current date and time:', now.toISOString(), 'Day of week:', day);
        const venues = await fetchAllVenuesFromFirestore();
        const prompt = buildBookVenuePrompt(message, venues, now);
        const reply = await aiClient.generateResponse(prompt);
        const replyParsed: BookingReplyAi = JSON.parse(reply);
        console.log('AI response generated:',  reply,'\n', typeof reply);

        const candidateVenues = mergeVenueCandidates(message, replyParsed, venues);
        if (candidateVenues.length > 0) {
            replyParsed.venueId = candidateVenues.map((venue) => venue.id);
            replyParsed.venueName = candidateVenues.map((venue) => venue.name);
        }

        const normalizedBookingWindow = normalizeBookingWindow(message, now, replyParsed.startDate, replyParsed.endDate);
        if (normalizedBookingWindow) {
            replyParsed.startDate = normalizedBookingWindow.startDate;
            replyParsed.endDate = normalizedBookingWindow.endDate;
            console.log('Normalized booking window:', normalizedBookingWindow.startDate.toISOString(), normalizedBookingWindow.endDate.toISOString());
        }
        
        let availableVenues: string[] = [];
        if (replyParsed.startDate && replyParsed.endDate && Array.isArray(replyParsed.venueId)) {
            const checks = await Promise.all(
                replyParsed.venueId.map(async (venueId: string) => {
                    console.log(`Checking availability for venueId: ${venueId} from ${replyParsed.startDate} to ${replyParsed.endDate}`);
                    const isAvailable = await checkAvailability(venueId, new Date(replyParsed.startDate), new Date(replyParsed.endDate));
                    return isAvailable ? venueId : null;
                })
            );
            availableVenues = checks.filter((id): id is string => id !== null);
        }

        let venuePromptConfirmation: BookingActionPrompt | null = null;
        if (availableVenues.length > 0 && replyParsed.intent === 'book') {
            logger.info('Venue is available for booking');
            venuePromptConfirmation = {
                id: '',
                intent: replyParsed.intent,
                userId: '0234',
                userName: 'John Doe',
                venueId: availableVenues[0], // Assuming the first available venue is auto selected for booking
                venueName: venues.find(v => v.id === availableVenues[0])?.name || '',
                pricePerHour: venues.find(v => v.id === availableVenues[0])?.pricePerHour || 0,
                startDate: new Date(replyParsed.startDate),
                endDate: new Date(replyParsed.endDate),
                status: 'pending',
                createdAt: getCurrentDate(),
                updatedAt: getCurrentDate(),
                notes: ''
            };
        }
        if (replyParsed.startDate && replyParsed.endDate && Array.isArray(replyParsed.venueId) && availableVenues.length < 1 && replyParsed.intent === 'book') {
            replyParsed.reply = 'Sorry, the venue(s) you requested are not available for the selected time slot. Please choose a different time or venue.';
        } 
        
        return new Response(
            JSON.stringify({ reply: replyParsed, available: availableVenues, venuePromptConfirmation: venuePromptConfirmation}),
            {
                status: 200,
                headers: corsHeaders(),
            }
        );
    } catch (error) {
        console.error('Error in AI booking route:', error);
        logger.error('AI request failed');

        return new Response(
            JSON.stringify({ error: 'AI service unavailable' }),
            {
                status: 500,
                headers: corsHeaders(),
            }
        );
    }
}

