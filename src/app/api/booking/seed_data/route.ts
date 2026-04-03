import { seedVenues } from '../../../../core/booking/seed_firestore_venues';
import { corsHeaders } from '../../helper';

// Handle preflight (OPTIONS)
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(),
    });
}

// GET /api/booking/venues - fetch all venues
export async function GET() {
    console.log('seeding all venues to Firestore...');

    try {
        await seedVenues();
        return new Response(
            JSON.stringify({ message: 'Venues seeded successfully' }),
            { status: 200, headers: corsHeaders() }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to seed venues' }),
            { status: 500, headers: corsHeaders() }
        );
    }
}
