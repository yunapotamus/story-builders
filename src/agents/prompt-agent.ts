import { BaseAgent, AgentContext } from './base-agent';
import { AIMessage } from '../ai-providers';

export class PromptAgent extends BaseAgent {
  async processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: this.formatUserMessage(userMessage, context),
      },
    ];

    if (this.isEmptyOrGreeting(userMessage)) {
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
    return `Hi! I'm the Prompt Agent. I generate creative writing prompts and discuss your writing.

You can:
1. Ask me for a writing prompt (e.g., "Give me a prompt" or "Prompt for a mystery story")
2. Share what you wrote from a prompt and discuss it with me
3. Ask for specific types of prompts (character-based, setting-based, etc.)

What would you like to do today?`;
  }
}
