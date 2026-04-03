export interface BookingActionPrompt {
    id: string;
    intent: 'book' | 'cancel' | 'faq' | 'other';
    userId: string;
    userName: string;
    venueId: string;
    venueName: string;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    createdAt: Date;
    updatedAt: Date;
    pricePerHour: number;
    notes?: string;
}