import { BaseAgent, AgentContext } from './base-agent';
import { AIMessage } from '../ai-providers';

export class CritiqueAgent extends BaseAgent {
  async processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<string> {
    // Build the conversation
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: this.formatUserMessage(userMessage, context),
      },
    ];

    // If there's no file attached, prompt the user to provide writing
    if (!context.fileContent && !this.seemsLikeWritingSample(userMessage)) {
      return this.getHelpMessage();
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
