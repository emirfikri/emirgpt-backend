const allowedOrigins = [
    "https://ai.emirfikri.com",
    "http://localhost:3000",
];

export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': allowedOrigins,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}