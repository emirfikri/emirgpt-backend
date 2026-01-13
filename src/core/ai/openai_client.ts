import { AIClient } from './ai_client';
import { env } from '../config/env';

export class OpenAIClient implements AIClient {
    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4.1-nano',
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('OpenAI error response:', text);
            throw new Error(`Failed to call AI provider: ${JSON.parse(text).error.message}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
}
