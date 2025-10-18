export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProviderResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIProviderOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface IAIProvider {
  /**
   * Send a message to the AI provider and get a response
   */
  sendMessage(
    messages: AIMessage[],
    options: AIProviderOptions
  ): Promise<AIProviderResponse>;

  /**
   * Get the provider name
   */
  getName(): string;

  /**
   * Check if the provider is configured and ready
   */
  isReady(): boolean;
}
