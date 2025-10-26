import { App } from '@slack/bolt';
import { AgentRegistry } from '../../agents';
import { AgentContext, ThreadMessage } from '../../agents/base-agent';
import { formatForSlack } from '../format-slack';

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
  event: any,
  say: any,
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

  // Fetch thread history if this is in a thread
  if (event.thread_ts) {
    context.threadHistory = await getThreadHistory(client, event.channel, event.thread_ts);
  }

  // Check for file attachments
  if ('files' in event && event.files && event.files.length > 0) {
    const files = [];

    for (const file of event.files) {
      const fileContent = await downloadFile(client, file);
      if (fileContent) {
        files.push({
          name: file.name,
          content: fileContent,
        });
      }
    }

    if (files.length > 0) {
      context.files = files;
      // For backwards compatibility, also set the first file
      context.fileContent = files[0].content;
      context.fileName = files[0].name;
    }
  }

  // Add "eyes" reaction to show we're processing
  await client.reactions.add({
    channel: event.channel,
    timestamp: event.ts,
    name: 'eyes',
  });

  try {
    // Process the message with the agent
    const response = await agent.processMessage(text, context);

    // Convert Markdown to Slack mrkdwn format
    const formattedResponse = formatForSlack(response);

    // Send the response
    await say({
      text: formattedResponse,
      thread_ts: context.threadTs,
    });

    // Remove "eyes" and add "white_check_mark" to show we're done
    await client.reactions.remove({
      channel: event.channel,
      timestamp: event.ts,
      name: 'eyes',
    });

    await client.reactions.add({
      channel: event.channel,
      timestamp: event.ts,
      name: 'white_check_mark',
    });
  } catch (error) {
    // Remove "eyes" reaction on error
    await client.reactions.remove({
      channel: event.channel,
      timestamp: event.ts,
      name: 'eyes',
    }).catch(() => {/* ignore errors removing reaction */});

    // Re-throw to be caught by outer handler
    throw error;
  }
}

/**
 * Infer which agent to use based on message content
 */
function inferAgentFromContext(text: string): 'critique' | 'craft' | 'prompt' | 'coach' {
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

  if (
    lower.includes('coach') ||
    lower.includes('celebrate') ||
    lower.includes('milestone') ||
    lower.includes('goal') ||
    lower.includes('submitted') ||
    lower.includes('finished') ||
    lower.includes('completed')
  ) {
    return 'coach';
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
 * Fetch thread history from Slack
 */
async function getThreadHistory(
  client: any,
  channelId: string,
  threadTs: string
): Promise<ThreadMessage[]> {
  try {
    const result = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      limit: 100, // Get up to 100 messages in the thread
    });

    if (!result.ok || !result.messages) {
      console.error('Failed to fetch thread history');
      return [];
    }

    const messages: ThreadMessage[] = [];
    const userCache = new Map<string, string>();

    for (const msg of result.messages) {
      // Skip the current message (we'll add it separately)
      // Skip bot messages that are just typing indicators
      if (msg.text === '_Processing..._') continue;

      // Determine role
      let role: 'user' | 'assistant' = 'user';
      let userName = 'User';

      if (msg.bot_id) {
        // This is a bot message (our agent)
        role = 'assistant';
        userName = msg.username || 'Story Builders';
      } else if (msg.user) {
        // This is a user message
        // Get user name from cache or fetch it
        if (!userCache.has(msg.user)) {
          userCache.set(msg.user, await getUserName(client, msg.user));
        }
        userName = userCache.get(msg.user) || 'User';
      }

      // Clean up the message text (remove bot mentions)
      let cleanText = msg.text || '';
      cleanText = cleanText.replace(/<@[A-Z0-9]+>/g, '').trim();

      messages.push({
        role,
        userName,
        text: cleanText,
        timestamp: msg.ts,
      });
    }

    console.log(`Fetched ${messages.length} messages from thread ${threadTs}`);
    return messages;
  } catch (error) {
    console.error('Error fetching thread history:', error);
    return [];
  }
}

/**
 * Download file content from Slack
 */
async function downloadFile(client: any, file: any): Promise<string | null> {
  try {
    // Check if this is a text-based file we can process
    const writingFileExtensions = /\.(txt|md|tex|rtf|doc|docx|markdown|text)$/i;
    const isTextMimetype = file.mimetype?.includes('text') || file.mimetype?.includes('latex');
    const isWritingFile = writingFileExtensions.test(file.name);

    if (!isTextMimetype && !isWritingFile) {
      console.log(`Skipping non-text file: ${file.name} (${file.mimetype})`);
      return null;
    }

    // Check file size (limit to 1MB for text files)
    if (file.size > 1024 * 1024) {
      console.log(`File too large: ${file.name} (${file.size} bytes)`);
      return null;
    }

    // Download the file content using the Slack Web API
    console.log(`Downloading file: ${file.name} (${file.size} bytes)`);

    // Fetch the file content - Slack requires authentication via the bot token
    const response = await fetch(file.url_private_download, {
      headers: {
        'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to download file: HTTP ${response.status}`);
      return null;
    }

    const content = await response.text();
    console.log(`Successfully downloaded ${content.length} characters from ${file.name}`);

    return content;
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
