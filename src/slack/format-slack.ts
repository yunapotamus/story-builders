/**
 * Convert Markdown formatting to Slack mrkdwn format
 */
export function formatForSlack(text: string): string {
  let formatted = text;

  // Preserve code blocks by temporarily replacing them
  const codeBlocks: string[] = [];
  formatted = formatted.replace(/```[\s\S]*?```/g, (match) => {
    const index = codeBlocks.length;
    codeBlocks.push(match);
    return `___CODE_BLOCK_${index}___`;
  });

  // Preserve inline code
  const inlineCode: string[] = [];
  formatted = formatted.replace(/`[^`]+`/g, (match) => {
    const index = inlineCode.length;
    inlineCode.push(match);
    return `___INLINE_CODE_${index}___`;
  });

  // Preserve already-converted bold text temporarily (including headers)
  const boldText: string[] = [];

  // Convert headers (# Header) to bold text (*Header*) and preserve them
  // Match 1-6 # symbols at start of line, followed by space and text
  formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, (match, content) => {
    const index = boldText.length;
    boldText.push(`*${content}*`);
    return `___BOLD_${index}___`;
  });

  // Convert ***bold italic*** first (must come before bold and italic)
  formatted = formatted.replace(/\*\*\*([^*]+)\*\*\*/g, '*_$1_*');

  // Convert **bold** to *bold* (Slack format) and preserve
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
    const index = boldText.length;
    boldText.push(`*${content}*`);
    return `___BOLD_${index}___`;
  });

  // Convert *italic* to _italic_ (Slack format)
  // Now we can safely convert remaining single asterisks
  formatted = formatted.replace(/\*([^*]+)\*/g, '_$1_');

  // Also convert _italic_ in markdown to _italic_ (already correct for Slack)
  // No change needed for underscores

  // Restore bold text
  boldText.forEach((bold, index) => {
    formatted = formatted.replace(`___BOLD_${index}___`, bold);
  });

  // Convert markdown links [text](url) to Slack format <url|text>
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');

  // Restore code blocks
  codeBlocks.forEach((code, index) => {
    formatted = formatted.replace(`___CODE_BLOCK_${index}___`, code);
  });

  // Restore inline code
  inlineCode.forEach((code, index) => {
    formatted = formatted.replace(`___INLINE_CODE_${index}___`, code);
  });

  return formatted;
}
