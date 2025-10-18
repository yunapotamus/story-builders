import { BaseAgent, AgentContext } from './base-agent';
import { AIMessage } from '../ai-providers';

export class CraftAgent extends BaseAgent {
  async processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Check if this is a request for a craft talk
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
    return `Hi! I'm the Craft Agent. I research and create writing craft talks on specific topics.

Ask me to prepare a craft talk on any writing topic, for example:
- "Can you prepare a craft talk on point of view?"
- "Create a presentation about dialogue tags and beats"
- "I need a talk about show vs tell"

I'll provide structured content with examples, exercises, and further reading recommendations.

What craft topic would you like to explore?`;
  }
}
