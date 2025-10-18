import OpenAI from 'openai';
import {
  IAIProvider,
  AIMessage,
  AIProviderResponse,
  AIProviderOptions,
} from './provider-interface';

export class OpenAIProvider implements IAIProvider {
  private client: OpenAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({ apiKey });
  }

  async sendMessage(
    messages: AIMessage[],
    options: AIProviderOptions
  ): Promise<AIProviderResponse> {
    // Convert messages to OpenAI format
    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (options.systemPrompt) {
      openaiMessages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    // Add all messages, combining system messages into the system prompt
    for (const message of messages) {
      if (message.role === 'system') {
        // Prepend to existing system message or create new one
        const existingSystem = openaiMessages.find((m) => m.role === 'system');
        if (existingSystem && 'content' in existingSystem) {
          existingSystem.content = `${existingSystem.content}\n\n${message.content}`;
        } else {
          openaiMessages.unshift({
            role: 'system',
            content: message.content,
          });
        }
      } else {
        openaiMessages.push({
          role: message.role,
          content: message.content,
        });
      }
    }

    const response = await this.client.chat.completions.create({
      model: options.model,
      messages: openaiMessages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 1.0,
    });

    const choice = response.choices[0];
    if (!choice?.message?.content) {
      throw new Error('No content in OpenAI response');
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  getName(): string {
    return 'openai';
  }

  isReady(): boolean {
    return !!this.apiKey;
  }
}
