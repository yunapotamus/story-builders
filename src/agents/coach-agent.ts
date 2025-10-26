import { BaseAgent, AgentContext } from './base-agent';
import { AIMessage } from '../ai-providers';

export class CoachAgent extends BaseAgent {
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

    // Check if this is a greeting (only if no thread context)
    const hasContext = context.threadHistory && context.threadHistory.length > 0;
    if (this.isEmptyOrGreeting(userMessage) && !hasContext) {
      return this.getHelpMessage();
    }

    return await this.sendToAI(messages);
  }

  private isEmptyOrGreeting(message: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'help'];
    const trimmed = message.trim().toLowerCase();
    return trimmed.length < 10 || greetings.some((g) => trimmed === g);
  }

  private getHelpMessage(): string {
    return `Hi! I'm your Writing Coach. I'm here to celebrate your wins and support your writing journey.

Share with me:
1. Writing goals you've hit (word counts, daily streaks, habits)
2. Submissions or publications (acceptances AND rejections - they're all progress!)
3. Creative breakthroughs (finished drafts, solved plot problems, character insights)
4. Personal growth moments (trying new techniques, overcoming fears)

What would you like to celebrate or talk about today?`;
  }
}
