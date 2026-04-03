export interface BookingReplyAi {
    intent: "book" | "cancel" | "faq" | "other";
    sport: string;
    startDate: Date;
    endDate: Date; // always 1 hour after startDate
    time: string;
    venueId: string[]; // one or more venue IDs
    venueName: string[];
    reply: string;
}