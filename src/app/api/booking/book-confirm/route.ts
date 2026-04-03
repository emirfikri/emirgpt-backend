import { NextRequest } from 'next/server';
import { checkAvailability, createBooking } from '@/core/booking/google_firestore';
import { BookingActionPrompt } from '@/core/booking/model/bookingConfirmation';
import { corsHeaders } from '../../helper';
import { logger } from '@/core/logging/logger';


// Handle preflight (OPTIONS)
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
}

export async function POST(req: NextRequest) {
    try {


        logger.info('Book-Confirm request received');
        const data:BookingActionPrompt = await req.json();
        console.log('Received booking confirmation request:', data);
        if (!data) {
            return new Response(
                JSON.stringify({ error: 'data is required' }),
                {
                    status: 400,
                    headers: corsHeaders(),
                }
            );
        }
        
        // const data:BookingActionPrompt = await req.json();
        data.createdAt = new Date();
        data.updatedAt = new Date();
        data.startDate = new Date(data.startDate);
        data.endDate = new Date(data.endDate); 
        // Optionally validate data here
        const isAvailable = await checkAvailability(data.venueId, data.startDate, data.endDate);
        if (!isAvailable) {
            return new Response(
                JSON.stringify({ success: false, error: 'Venue is not available for the selected time slot' }),
                { status: 400, headers: corsHeaders() }
            );
        }
        else {
            const docRef = await createBooking(data);
            return new Response(
                JSON.stringify({ success: true, data: docRef,reply: `Booking confirmed successfully BookingID: ${docRef.id}` }),
                { status: 200, headers: corsHeaders() }
            );
        }
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { status: 500, headers: corsHeaders() }
        );
    }
}