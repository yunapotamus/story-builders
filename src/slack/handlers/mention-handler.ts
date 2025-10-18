import { App, AppMentionEvent, SayFn } from '@slack/bolt';
import { AgentRegistry } from '../../agents';
import { AgentContext } from '../../agents/base-agent';

export function registerMentionHandler(app: App, registry: AgentRegistry) {
  app.event('app_mention', async ({ event, say, client }) => {
    try {
      await handleMention(event, say, client, registry);
    } catch (error) {
      console.error('Error handling mention:', error);
      await say({
        text: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        thread_ts: event.thread_ts || event.ts,
      });
    }
  });
}

async function handleMention(
  event: AppMentionEvent,
  say: SayFn,
  client: any,
  registry: AgentRegistry
) {
  // Extract the message text and remove the bot mention
  const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

  // Try to determine which agent is being called
  // Look for agent names in the message
  let agentType = registry.getAgentTypeFromMention(text);

  // If no agent specified, try to infer from context or default to critique
  if (!agentType) {
    agentType = inferAgentFromContext(text);
  }

  const agent = registry.getAgent(agentType);
  if (!agent) {
    await say({
      text: getAvailableAgentsMessage(registry),
      thread_ts: event.thread_ts || event.ts,
    });
    return;
  }

  // Build agent context
  const context: AgentContext = {
    userId: event.user,
    userName: await getUserName(client, event.user),
    channelId: event.channel,
    threadTs: event.thread_ts || event.ts,
  };

  // Check for file attachments
  if ('files' in event && event.files && event.files.length > 0) {
    const file = event.files[0];
    const fileContent = await downloadFile(client, file);
    if (fileContent) {
      context.fileContent = fileContent;
      context.fileName = file.name;
    }
  }

  // Send typing indicator
  await client.chat.postMessage({
    channel: event.channel,
    thread_ts: context.threadTs,
    text: '_Processing..._',
  });

  // Process the message with the agent
  const response = await agent.processMessage(text, context);

  // Send the response
  await say({
    text: response,
    thread_ts: context.threadTs,
  });
}

/**
 * Infer which agent to use based on message content
 */
function inferAgentFromContext(text: string): 'critique' | 'craft' | 'prompt' {
  const lower = text.toLowerCase();

  if (
    lower.includes('critique') ||
    lower.includes('feedback') ||
    lower.includes('review')
  ) {
    return 'critique';
  }

  if (
    lower.includes('craft talk') ||
    lower.includes('presentation') ||
    lower.includes('teach')
  ) {
    return 'craft';
  }

  if (
    lower.includes('prompt') ||
    lower.includes('writing exercise') ||
    lower.includes('idea')
  ) {
    return 'prompt';
  }

  // Default to critique
  return 'critique';
}

/**
 * Get user's display name
 */
async function getUserName(client: any, userId: string): Promise<string> {
  try {
    const result = await client.users.info({ user: userId });
    return result.user.profile.display_name || result.user.name || 'Writer';
  } catch (error) {
    console.error('Error getting user name:', error);
    return 'Writer';
  }
}

/**
 * Download file content from Slack
 */
async function downloadFile(client: any, file: any): Promise<string | null> {
  try {
    // Only download text files
    if (!file.mimetype?.includes('text') && !file.name?.match(/\.(txt|md|doc)$/i)) {
      return null;
    }

    // Slack files API requires different authentication
    // For now, we'll skip file downloads and rely on copy-paste
    // In production, you'd use the files.info and download the content
    return null;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
}

/**
 * Get message about available agents
 */
function getAvailableAgentsMessage(registry: AgentRegistry): string {
  const agents = registry.getAvailableAgents();
  const descriptions = agents
    .map((type) => {
      const info = registry.getAgentInfo(type);
      return info ? `• @${type}: ${info.description}` : null;
    })
    .filter(Boolean)
    .join('\n');

  return `I have several specialized agents available:\n\n${descriptions}\n\nMention an agent name or I'll try to figure out which one you need!`;
}
