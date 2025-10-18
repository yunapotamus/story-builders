import dotenv from 'dotenv';

dotenv.config();

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
  },
  ai: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    defaultProvider: (process.env.DEFAULT_AI_PROVIDER || 'anthropic') as 'anthropic' | 'openai',
  },
  gcp: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
};

export function validateConfig() {
  const errors: string[] = [];

  if (!config.slack.botToken) errors.push('SLACK_BOT_TOKEN is required');
  if (!config.slack.signingSecret) errors.push('SLACK_SIGNING_SECRET is required');

  if (!config.ai.anthropicApiKey && !config.ai.openaiApiKey) {
    errors.push('At least one AI provider API key is required (ANTHROPIC_API_KEY or OPENAI_API_KEY)');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
