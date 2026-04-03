import { fetchAllVenuesFromFirestore } from '@/core/booking/google_firestore';
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
    console.log('Fetching all venues from Firestore...');

	try {
		const venues = await fetchAllVenuesFromFirestore();
		return new Response(
			JSON.stringify({ venues }),
			{ status: 200, headers: corsHeaders() }
		);
	} catch (error) {
		return new Response(
			JSON.stringify({ error: 'Failed to fetch venues' }),
			{ status: 500, headers: corsHeaders() }
		);
	}
}
