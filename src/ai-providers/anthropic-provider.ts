import Anthropic from '@anthropic-ai/sdk';
import {
  IAIProvider,
  AIMessage,
  AIProviderResponse,
  AIProviderOptions,
} from './provider-interface';

export class AnthropicProvider implements IAIProvider {
  private client: Anthropic;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new Anthropic({ apiKey });
  }

  async sendMessage(
    messages: AIMessage[],
    options: AIProviderOptions
  ): Promise<AIProviderResponse> {
    // Filter out system messages and combine them with the systemPrompt
    const userMessages = messages.filter((m) => m.role !== 'system');
    const systemMessages = messages.filter((m) => m.role === 'system');

    const systemPrompt = [
      ...systemMessages.map((m) => m.content),
      options.systemPrompt,
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await this.client.messages.create({
      model: options.model,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature || 1.0,
      system: systemPrompt,
      messages: userMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Anthropic response');
    }

    return {
      content: textContent.text,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  getName(): string {
    return 'anthropic';
  }

  isReady(): boolean {
    return !!this.apiKey;
  }
}
