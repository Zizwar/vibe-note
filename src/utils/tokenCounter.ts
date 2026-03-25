// Simple token estimation based on GPT tokenization rules
// ~4 characters per token for English, ~2 for CJK/Arabic
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Count words (whitespace-separated)
  const words = text.trim().split(/\s+/).length;
  // Count characters
  const chars = text.length;

  // Rough estimation: ~0.75 tokens per word for English
  // Average of word-based and char-based estimates
  const wordEstimate = Math.ceil(words * 1.3);
  const charEstimate = Math.ceil(chars / 4);

  return Math.max(wordEstimate, charEstimate);
}

export function formatTokenCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
