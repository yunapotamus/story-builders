import { BaseAgent, AgentContext } from './base-agent';
import { AIMessage } from '../ai-providers';

export class RecommendAgent extends BaseAgent {
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
    return `Hi! I'm your Reading Recommendations agent. I help writers discover books, stories, and authors based on what you've enjoyed.

Share with me:
1. Books or stories you loved - tell me what resonated with you
2. Specific elements you're looking for (themes, style, voice, etc.)
3. Authors whose work you admire
4. Literary magazines or short fiction you want to explore

I'll recommend similar works and explain what makes them worth reading, especially from a writer's perspective.

What are you in the mood to discover?`;
  }
}
