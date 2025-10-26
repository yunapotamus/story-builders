# Story Builders

AI-powered Slack agents for writing groups - providing critique, craft talks, and writing prompts.

## Features

- **@critique** - Get thoughtful, constructive feedback on your writing samples
- **@craft** - Research and prepare writing craft talks on specific topics
- **@prompt** - Generate creative writing prompts and discuss your work
- **@coach** - Celebrate milestones and get motivational support for your writing journey
- **@recommend** - Get reading recommendations based on books and authors you've enjoyed (provides suggestions first, then asks clarifying questions)

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
   - Navigate to **OAuth & Permissions** and add these **Bot Token Scopes**:
     - `app_mentions:read` - Listen for @mentions of the bot
     - `chat:write` - Send messages as the bot
     - `files:read` - Read files uploaded by users
     - `users:read` - Get user display names
     - `channels:history` - Read thread history in public channels
     - `groups:history` - Read thread history in private channels
     - `mpim:history` - Read thread history in group DMs
     - `im:history` - Read thread history in DMs
     - `reactions:write` - Add/remove emoji reactions for status
   - Navigate to **Socket Mode** and enable it (for development)
   - Generate an App-Level Token with `connections:write` scope
   - Navigate to **Event Subscriptions** and toggle it on
   - Subscribe to these bot events:
     - `app_mention` - When bot is @mentioned
     - `app_home_opened` - When user views the app home
   - Install the app to your workspace
   - Copy these tokens to your `.env` file:
     - **Bot User OAuth Token** → `SLACK_BOT_TOKEN`
     - **Signing Secret** (from Basic Information) → `SLACK_SIGNING_SECRET`
     - **App-Level Token** → `SLACK_APP_TOKEN`

5. **Run in development mode**
   ```bash
   npm run dev
   ```

## Testing Agents Locally

You can test agents directly from the command line without needing Slack:

```bash
npm run test-agent "<message>"
```

**Examples:**
```bash
# Test with explicit agent mention
npm run test-agent "@coach I just finished my first draft!"
npm run test-agent "@critique Please review this passage: It was a dark and stormy night..."
npm run test-agent "@recommend I loved 'The Night Circus' - what should I read next?"

# Test with auto-detection
npm run test-agent "I just submitted my story to a magazine!"  # Infers coach
npm run test-agent "Can you critique this paragraph?"          # Infers critique
npm run test-agent "What books are similar to Ursula K. Le Guin?"  # Infers recommend
```

This simulates the exact Slack experience including agent detection, letting you quickly iterate on agent prompts and behavior.

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
│   ├── prompt-agent.ts
│   ├── coach-agent.ts
│   └── recommend-agent.ts
├── ai-providers/        # AI provider abstractions
│   ├── anthropic-provider.ts
│   └── openai-provider.ts
├── slack/              # Slack integration
│   ├── app.ts
│   └── handlers/
├── config/             # Configuration
│   ├── agents.yaml     # Agent system prompts
│   └── env.ts
├── test-agent.ts      # CLI tool for testing agents locally
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
   @Story Builders @coach I just finished my first draft!
   @Story Builders @recommend I loved "The Night Circus" - what should I read next?
   ```

3. **The bot will infer the agent if you don't specify**
   ```
   @Story Builders Can you critique this passage? [paste writing]
   @Story Builders I just submitted my story to a magazine!  # Infers coach
   @Story Builders What books are similar to Ursula K. Le Guin?  # Infers recommend
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
