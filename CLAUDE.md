# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Story Builders is a Slack bot that provides AI-powered writing assistance through specialized agents. Writers in a Slack workspace can @mention the bot along with an agent name (@critique, @craft, or @prompt) to get help with different aspects of their writing practice.

## Commands

### Development
```bash
npm run dev          # Run in development mode with auto-reload (uses Socket Mode)
npm run build        # Compile TypeScript to dist/
npm start            # Run production build
```

### Testing
```bash
npm test             # Run tests (not yet implemented)
```

### Deployment
```bash
# First time setup
export GOOGLE_CLOUD_PROJECT=your-project-id
./infrastructure/setup-secrets.sh    # Configure GCP secrets

# Deploy to Cloud Run
./infrastructure/deploy.sh
```

## Architecture

### Agent System

The core architecture uses a **plugin-based agent system** where each agent type is a specialized module that extends `BaseAgent`:

- **BaseAgent** (`src/agents/base-agent.ts`) - Abstract base class that all agents extend. Provides common functionality:
  - AI provider injection (allows switching between Anthropic/OpenAI)
  - System prompt loading from YAML config
  - Message formatting with file attachments
  - Standard interface for processing messages

- **Agent Types**:
  - `CritiqueAgent` - Analyzes writing samples and provides constructive feedback
  - `CraftAgent` - Researches topics and creates educational craft talks
  - `PromptAgent` - Generates creative prompts and discusses writing results

- **AgentRegistry** (`src/agents/agent-registry.ts`) - Central registry that:
  - Loads agent configurations from `src/config/agents.yaml`
  - Instantiates agents with appropriate AI providers
  - Routes @mentions to the correct agent based on keywords
  - Falls back to inference if no agent explicitly specified

### AI Provider Abstraction

All AI interactions go through the `IAIProvider` interface (`src/ai-providers/provider-interface.ts`):

- Allows agents to work with any LLM provider without code changes
- Currently implements: `AnthropicProvider` and `OpenAIProvider`
- Handles provider-specific message formatting (e.g., system prompts differ between APIs)
- Normalizes responses into a common format

**To add a new AI provider:**
1. Implement `IAIProvider` interface
2. Add to `getProvider()` function in `src/ai-providers/index.ts`
3. Update config to include API key handling

### Slack Integration

The Slack app uses the Bolt framework with two modes:

- **Socket Mode** (development) - Maintains WebSocket connection, no public URL needed
- **HTTP Mode** (production) - Receives events via webhooks at Cloud Run URL

Event flow:
1. User @mentions bot in Slack
2. `mention-handler.ts` receives `app_mention` event
3. Handler extracts message text and determines which agent to use
4. Builds `AgentContext` with user info, thread, and any file attachments
5. Calls agent's `processMessage()` method
6. Posts AI response back to the thread

### Configuration

Agent behavior is defined in `src/config/agents.yaml`:
- System prompts (the personality and instructions for each agent)
- Default AI provider and model
- Agent name and description

**To modify agent behavior:** Edit the `systemPrompt` field in the YAML. Changes take effect on next restart.

**To add a new agent:**
1. Create agent class extending `BaseAgent` in `src/agents/`
2. Add config entry to `agents.yaml`
3. Register in `AgentRegistry.initializeAgents()`
4. Update mention handler's `inferAgentFromContext()` for keyword routing

### Deployment

The app is containerized and designed for **GCP Cloud Run**:

- **Dockerfile** - Multi-stage build (build TypeScript → production runtime)
- **cloudbuild.yaml** - CI/CD pipeline that builds, pushes to GCR, and deploys
- **Secret Manager** - Stores sensitive credentials (Slack tokens, API keys)
- **Cloud Logging** - All console.log statements flow to Cloud Logging

The app automatically detects production vs development via `NODE_ENV`:
- Development: Uses Socket Mode, verbose logging
- Production: Uses HTTP webhooks, INFO-level logging

## File Structure Context

```
src/
├── agents/                  # Agent implementations
│   ├── base-agent.ts        # Abstract base - extend this for new agents
│   ├── critique-agent.ts    # Handles writing feedback
│   ├── craft-agent.ts       # Handles craft talk generation
│   ├── prompt-agent.ts      # Handles prompt generation
│   └── agent-registry.ts    # Routes messages to agents
├── ai-providers/            # LLM provider abstractions
│   ├── provider-interface.ts  # Interface all providers must implement
│   ├── anthropic-provider.ts  # Claude integration
│   ├── openai-provider.ts     # GPT integration
│   └── index.ts               # Provider factory functions
├── slack/                   # Slack Bolt app setup
│   ├── app.ts               # Creates and configures Bolt app
│   └── handlers/
│       └── mention-handler.ts  # Handles @mention events
├── config/
│   ├── agents.yaml          # Agent system prompts and settings
│   └── env.ts               # Environment variable validation
└── index.ts                 # Application entry point

infrastructure/
├── cloudbuild.yaml          # GCP CI/CD pipeline
├── deploy.sh                # Deployment script
└── setup-secrets.sh         # Secret Manager setup
```

## Development Workflow

1. **Local development** uses Socket Mode - no webhooks needed, just set `SLACK_APP_TOKEN`
2. **Making changes to agents**: Edit `agents.yaml` for prompt changes, or the agent class for logic changes
3. **Testing**: Currently manual testing in Slack. Future: add unit tests for agent logic
4. **Deploying**: Run `./infrastructure/deploy.sh` which triggers Cloud Build

## Important Notes

- File downloads from Slack are currently disabled in `mention-handler.ts` due to auth complexity. Users should paste text directly or use Slack's copy-paste
- The app uses threading - all responses go to the thread started by the user's @mention
- Agent inference (detecting which agent based on keywords) happens if user doesn't specify - see `inferAgentFromContext()`
- The YAML config is copied into the Docker image during build - changes require rebuild/redeploy
