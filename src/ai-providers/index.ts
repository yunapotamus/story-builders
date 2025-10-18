import { config } from '../config/env';
import { AnthropicProvider } from './anthropic-provider';
import { OpenAIProvider } from './openai-provider';
import { IAIProvider } from './provider-interface';

export * from './provider-interface';
export * from './anthropic-provider';
export * from './openai-provider';

/**
 * Get an AI provider by name
 */
export function getProvider(name: 'anthropic' | 'openai'): IAIProvider {
  switch (name) {
    case 'anthropic':
      if (!config.ai.anthropicApiKey) {
        throw new Error('Anthropic API key not configured');
      }
      return new AnthropicProvider(config.ai.anthropicApiKey);

    case 'openai':
      if (!config.ai.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }
      return new OpenAIProvider(config.ai.openaiApiKey);

    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}

/**
 * Get the default AI provider
 */
export function getDefaultProvider(): IAIProvider {
  return getProvider(config.ai.defaultProvider);
}
