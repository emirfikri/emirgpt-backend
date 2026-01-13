export const env = {
    openAiKey: process.env.OPENAI_API_KEY as string,
};

if (!env.openAiKey) {
    throw new Error('OPENAI_API_KEY is not set');
}