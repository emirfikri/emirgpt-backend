import { OpenAIClient } from '@/core/ai/openai_client';
import { logger } from '@/core/logging/logger';
import { corsHeaders } from '../../helper';
import { buildBookVenueFAQ } from '@/core/booking/prompt_faq';

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
        const prompt = buildBookVenueFAQ(message);
        const reply = await aiClient.generateResponse(prompt);
        return new Response(
            JSON.stringify({ reply: reply }),
            {
                status: 200,
                headers: corsHeaders(),
            }
        );
    } catch (error) {
        console.error('Error in AI booking faq:', error);
        logger.error('AI request failed');

        return new Response(
            JSON.stringify({ error: 'faq service unavailable' }),
            {
                status: 500,
                headers: corsHeaders(),
            }
        );
    }
}

