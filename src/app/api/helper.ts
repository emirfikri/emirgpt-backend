export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*.ai.emirfikri.*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}