import { App, LogLevel } from '@slack/bolt';
import { config } from '../config/env';
import { AgentRegistry } from '../agents';
import { registerMentionHandler } from './handlers/mention-handler';

export function createSlackApp(): App {
  const app = new App({
    token: config.slack.botToken,
    signingSecret: config.slack.signingSecret,
    // Socket mode for development, HTTP for production
    socketMode: config.app.nodeEnv === 'development',
    appToken: config.app.nodeEnv === 'development' ? config.slack.appToken : undefined,
    logLevel: config.app.nodeEnv === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  });

  // Initialize agent registry
  const registry = new AgentRegistry();

  // Register event handlers
  registerMentionHandler(app, registry);

  // Add a simple home view
  app.event('app_home_opened', async ({ event, client }) => {
    try {
      await client.views.publish({
        user_id: event.user,
        view: {
          type: 'home',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Welcome to Story Builders!* :books:',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'I provide AI-powered writing assistance with specialized agents:\n\n' +
                  '• *@critique* - Get thoughtful feedback on your writing\n' +
                  '• *@craft* - Research and prepare writing craft talks\n' +
                  '• *@prompt* - Generate creative prompts and discuss your work\n\n' +
                  '_To use an agent, @mention me in a channel and include the agent name!_',
              },
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error publishing home view:', error);
    }
  });

  return app;
}

export async function startSlackApp(app: App) {
  const port = config.app.port;

  if (config.app.nodeEnv === 'development') {
    // Socket mode for development
    await app.start();
    console.log('⚡️ Story Builders is running in socket mode!');
  } else {
    // HTTP mode for production (Cloud Run)
    await app.start(port);
    console.log(`⚡️ Story Builders is running on port ${port}!`);
  }
}
