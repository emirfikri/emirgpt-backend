import { OpenAIClient } from '@/core/ai/openai_client';
import { buildChatPrompt } from '@/core/ai/prompt_builder';
import { logger } from '@/core/logging/logger';

const aiClient = new OpenAIClient();

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        if (!message) {
            return Response.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        logger.info('AI request received');

        const prompt = buildChatPrompt(message);
        const reply = await aiClient.generateResponse(prompt);

        return Response.json({ reply });
    } catch (error) {
        logger.error('AI request failed');

        return Response.json(
            { error: error instanceof Error ? error.message : 'AI service unavailable' },
            { status: 500 }
        );
    }
}
