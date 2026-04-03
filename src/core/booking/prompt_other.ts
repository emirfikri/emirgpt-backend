export function buildBookVenueOther(userPrompt: string): string {

return`
extract the user question and answer the user question based on the information available in the list of venues and the user question, if you cannot find the answer from the list of venues, answer based on your general knowledge. 
but less than 50words. and user question is "${userPrompt}"
`;}
