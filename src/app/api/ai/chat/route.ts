import { OpenAIClient } from '@/core/ai/openai_client';
import { buildChatPrompt } from '@/core/ai/prompt_builder';
import { logger } from '@/core/logging/logger';
import { corsHeaders } from '../../helper';

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

        const prompt = buildChatPrompt(message);
        const reply = await aiClient.generateResponse(prompt);

        return new Response(
            JSON.stringify({ reply }),
            {
                status: 200,
                headers: corsHeaders(),
            }
        );
    } catch (error) {
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

