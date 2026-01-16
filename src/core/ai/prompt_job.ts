export function buildJobPrompt(resume: string, jobDescription: string): string {
  return `
You are an experienced technical recruiter.

Compare the following RESUME and JOB DESCRIPTION.

Return ONLY valid JSON in this format:
{
  "matchScore": number (0-100),
  "matchedSkills": string[],
  "missingSkills": string[],
  "improvementSuggestions": string[]
}

RESUME:
${resume}

Title And/OR JOB DESCRIPTION (IF AVAILABLE):
${jobDescription}
`;
}
