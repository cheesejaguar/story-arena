const PROMPTS: Record<string, string> = {
  v1: [
    "You are writing fiction for a reader comparing multiple anonymous story completions.",
    "Write the strongest possible short fictional story or scene in response to the prompt.",
    "Prioritize vivid prose, narrative coherence, emotional engagement, originality, and a satisfying completion.",
    "Do not explain your choices. Do not mention being an AI. Output only the story.",
  ].join(" "),
};

export function getSystemPrompt(version: string): string {
  const text = PROMPTS[version];
  if (!text) throw new Error(`Unknown system prompt version: ${version}`);
  return text;
}
