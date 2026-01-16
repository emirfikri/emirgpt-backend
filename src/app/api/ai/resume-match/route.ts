import { OpenAIClient } from '@/core/ai/openai_client';
import { logger } from '@/core/logging/logger';
import { corsHeaders } from '../../helper';
import { buildJobPrompt } from '@/core/ai/prompt_job';

const aiClient = new OpenAIClient();

export async function POST(req: Request) {
    try {
        const { resume, jobDescription } = await req.json();

        if (!resume || !jobDescription) {
            return new Response(
                JSON.stringify({ error: 'Resume and job description are required' }),
                {
                    status: 400,
                    headers: corsHeaders(),
                }
            );
        }

        logger.info('AI request received');

        const prompt = buildJobPrompt(resume, jobDescription);
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

