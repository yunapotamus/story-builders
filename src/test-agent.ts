#!/usr/bin/env ts-node
import { config } from 'dotenv';
import { AgentRegistry } from './agents';
import { AgentContext } from './agents/base-agent';

// Load environment variables
config();

/**
 * CLI tool to test agents locally without Slack
 */
async function main() {
  // Get message from command line arguments
  const message = process.argv.slice(2).join(' ');

  if (!message) {
    console.log('Usage: npm run test-agent "<message>"');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test-agent "@coach I just finished my first draft!"');
    console.log('  npm run test-agent "@critique Please review this passage: <text>"');
    console.log('  npm run test-agent "I submitted my story!"');
    console.log('');
    process.exit(1);
  }

  console.log('🤖 Story Builders - Agent Test\n');
  console.log('📝 Your message:', message);
  console.log('');

  try {
    // Initialize agent registry
    const registry = new AgentRegistry();

    // Extract the message text and remove bot mentions (simulating Slack)
    const text = message.replace(/<@[A-Z0-9]+>/g, '').trim();

    // Try to determine which agent is being called
    let agentType = registry.getAgentTypeFromMention(text);

    // If no agent specified, try to infer from context
    if (!agentType) {
      agentType = inferAgentFromContext(text);
      console.log(`🔍 No agent specified, inferred: ${agentType}\n`);
    } else {
      console.log(`✅ Agent detected: ${agentType}\n`);
    }

    const agent = registry.getAgent(agentType);
    if (!agent) {
      console.error(`❌ Agent not found: ${agentType}`);
      process.exit(1);
    }

    // Build minimal agent context for testing
    const context: AgentContext = {
      userId: 'test-user',
      userName: 'Test User',
      channelId: 'test-channel',
      threadTs: Date.now().toString(),
    };

    // Process the message
    console.log('⏳ Processing...\n');
    const response = await agent.processMessage(text, context);

    // Display the response
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 Agent Response:\n');
    console.log(response);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Infer which agent to use based on message content
 * (Same logic as in mention-handler.ts)
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

// Run the CLI tool
main();
