export function buildChatPrompt(userMessage: string): string {
    return `
You are a helpful, concise AI assistant.
Respond clearly and professionally.

User:
${userMessage}

Assistant:
`;
}
