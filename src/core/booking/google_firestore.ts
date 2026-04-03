import { BookingActionPrompt } from '@/core/booking/model/bookingConfirmation';
import { Venue } from '@/core/booking/model/venue';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
function initializeFirebaseApp() {
    if (!getApps().length) {
        return initializeApp({
            credential: applicationDefault(),
        });
    } else {  return getApps()[0]; }
}
const app = initializeFirebaseApp();

const db = getFirestore(app);

export async function fetchAllVenuesFromFirestore() {
    const snapshot = await db.collection('venues').get();
    const venues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // console.log('Fetched venues from Firestore:', venues);
    return venues as Venue[]; // Cast to any[] to match the expected return type
}

export async function checkAvailability(venueId: string, startDate: Date, endDate: Date) {
    // Ensure startDate and endDate are valid Date-compatible formats
    const start = Timestamp.fromDate(new Date(startDate));
    const end = Timestamp.fromDate(new Date(endDate));
    // Check for overlapping bookings: (existing.startDate < end) && (existing.endDate > start)
    const snapshot = await db.collection('bookings')
        .where('venueId', '==', venueId)
        .where('status', '==', 'confirmed')
        .where('startDate', '<=', end)
        .where('endDate', '>', start)
        .get();
    console.log(`Checking availability for venueId: ${venueId} from ${startDate} to ${endDate} - Bookings found: ${snapshot.size}`);
    if (snapshot.empty) {
        return true; // No bookings found, venue is available
    }else {
        return false; // Bookings found, venue is not available
    }

}

export async function fetchBookingbyUserId(userId: string) {
    const snapshot = await db.collection('bookings')
        .where('userId', '==', userId)
        .get();
    if (snapshot.empty) {
        throw new Error('No bookings found for the specified user');
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
    
export async function createBooking(bookingActionPrompt: BookingActionPrompt) {
    const bookingRef = await db.collection('bookings').add(bookingActionPrompt);
    const updatedBookingRef = db.collection('bookings').doc(bookingRef.id);
    await updatedBookingRef.update({ id: bookingRef.id, status: 'confirmed' });
    const updatedBooking = await updatedBookingRef.get();
    return { ...updatedBooking.data(), id: updatedBooking.id };
}