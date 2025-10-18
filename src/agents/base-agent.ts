import { IAIProvider, AIMessage } from '../ai-providers';

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  defaultProvider: 'anthropic' | 'openai';
  model: string;
}

export interface AgentContext {
  userId: string;
  userName: string;
  channelId: string;
  threadTs?: string;
  fileContent?: string;
  fileName?: string;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected provider: IAIProvider;

  constructor(config: AgentConfig, provider: IAIProvider) {
    this.config = config;
    this.provider = provider;
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get the agent's description
   */
  getDescription(): string {
    return this.config.description;
  }

  /**
   * Process a user message and return a response
   */
  abstract processMessage(
    userMessage: string,
    context: AgentContext
  ): Promise<string>;

  /**
   * Helper method to send a message to the AI provider
   */
  protected async sendToAI(
    messages: AIMessage[],
    temperature?: number
  ): Promise<string> {
    const response = await this.provider.sendMessage(messages, {
      model: this.config.model,
      systemPrompt: this.config.systemPrompt,
      temperature,
      maxTokens: 4096,
    });

    return response.content;
  }

  /**
   * Format user message with context
   */
  protected formatUserMessage(message: string, context: AgentContext): string {
    let formatted = message;

    if (context.fileContent && context.fileName) {
      formatted = `${message}\n\n[Attached file: ${context.fileName}]\n\`\`\`\n${context.fileContent}\n\`\`\``;
    }

    return formatted;
  }
}
