# Story Builders

AI-powered Slack agents for writing groups - providing critique, craft talks, and writing prompts.

## Features

- **@critique** - Get thoughtful, constructive feedback on your writing samples
- **@craft** - Research and prepare writing craft talks on specific topics
- **@prompt** - Generate creative writing prompts and discuss your work

## Quick Start

### Prerequisites

- Node.js 20+
- A Slack workspace with admin access
- API keys for Anthropic Claude and/or OpenAI
- (For production) A GCP account

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yunapotamus/story-builders.git
   cd story-builders
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Set up your Slack app**
   - Go to https://api.slack.com/apps
   - Create a new app "from scratch"
   - Enable Socket Mode (for development)
   - Add the following Bot Token Scopes:
     - `app_mentions:read`
     - `chat:write`
     - `files:read`
     - `users:read`
   - Install the app to your workspace
   - Copy the tokens to your `.env` file

5. **Run in development mode**
   ```bash
   npm run dev
   ```

## Deployment to GCP Cloud Run

### One-time Setup

1. **Set up GCP secrets**
   ```bash
   export GOOGLE_CLOUD_PROJECT=your-project-id
   ./infrastructure/setup-secrets.sh
   ```

2. **Update Slack app for production**
   - Disable Socket Mode
   - Enable Event Subscriptions
   - Add your Cloud Run URL as the Request URL (you'll get this after first deploy)
   - Subscribe to bot events: `app_mention`, `app_home_opened`

### Deploy

```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
./infrastructure/deploy.sh
```

## Project Structure

```
src/
├── agents/              # AI agent implementations
│   ├── base-agent.ts    # Base agent class
│   ├── critique-agent.ts
│   ├── craft-agent.ts
│   └── prompt-agent.ts
├── ai-providers/        # AI provider abstractions
│   ├── anthropic-provider.ts
│   └── openai-provider.ts
├── slack/              # Slack integration
│   ├── app.ts
│   └── handlers/
├── config/             # Configuration
│   ├── agents.yaml     # Agent system prompts
│   └── env.ts
└── index.ts           # Entry point
```

## Usage

### In Slack

1. **Invite the bot to a channel**
   ```
   /invite @Story Builders
   ```

2. **@mention the bot with an agent name**
   ```
   @Story Builders @critique [paste your writing or attach a file]
   @Story Builders @craft Can you prepare a talk about point of view?
   @Story Builders @prompt Give me a character-based prompt
   ```

3. **The bot will infer the agent if you don't specify**
   ```
   @Story Builders Can you critique this passage? [paste writing]
   ```

## Customization

### Modify Agent Prompts

Edit `src/config/agents.yaml` to customize how each agent behaves.

### Add a New Agent

1. Create a new agent class extending `BaseAgent`
2. Add configuration to `agents.yaml`
3. Register in `AgentRegistry`
4. Update the mention handler

## License

MIT - see LICENSE file for details
