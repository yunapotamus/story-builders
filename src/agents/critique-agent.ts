import { BaseAgent, AgentContext } from './base-agent';
import { AIMessage } from '../ai-providers';

export class CritiqueAgent extends BaseAgent {
  async processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<string> {
    // Build the conversation with thread history if available
    const messages: AIMessage[] = [];

    // Add thread history first (for context)
    if (context.threadHistory && context.threadHistory.length > 0) {
      for (const historyMsg of context.threadHistory) {
        messages.push({
          role: historyMsg.role,
          content: historyMsg.text,
        });
      }
    }

    // Add the current user message
    messages.push({
      role: 'user',
      content: this.formatUserMessage(userMessage, context),
    });

    // If there's no file attached and the message doesn't look like writing, show help
    // BUT: if a file is attached (even if empty), we should try to process it
    // ALSO: if we have thread history, we should continue the conversation
    const hasContext = context.threadHistory && context.threadHistory.length > 0;
    if (!context.fileContent && !this.seemsLikeWritingSample(userMessage) && !hasContext) {
      return this.getHelpMessage();
    }

    // If we have a file but it's empty/very short, let the user know
    if (context.fileContent && context.fileContent.trim().length < 20) {
      return `I received your file "${context.fileName}", but it appears to be empty or very short. Please make sure the file contains your writing sample and try again.`;
    }

    // Send to AI for critique
    return await this.sendToAI(messages);
  }

  /**
   * Check if the message seems to contain a writing sample
   */
  private seemsLikeWritingSample(message: string): boolean {
    // Simple heuristic: if message is longer than 100 characters and contains
    // narrative markers, it might be a writing sample
    if (message.length < 100) return false;

    const narrativeMarkers = [
      '"',
      '"',
      '"',
      'said',
      'thought',
      'walked',
      'looked',
      'felt',
    ];
    const lowerMessage = message.toLowerCase();

    return narrativeMarkers.some((marker) => lowerMessage.includes(marker));
  }

  /**
   * Get help message for using the critique agent
   */
  private getHelpMessage(): string {
    return `Hi! I'm the Critique Agent. I provide thoughtful feedback on your writing.

To get a critique, you can either:
1. Upload your writing as a file attachment and @mention me
2. Paste your writing directly in your message (works best for longer samples)

What would you like me to critique today?`;
  }
}
