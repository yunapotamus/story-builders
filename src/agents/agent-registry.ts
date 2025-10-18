import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { BaseAgent, AgentConfig } from './base-agent';
import { CritiqueAgent } from './critique-agent';
import { CraftAgent } from './craft-agent';
import { PromptAgent } from './prompt-agent';
import { IAIProvider, getProvider } from '../ai-providers';

type AgentType = 'critique' | 'craft' | 'prompt';

export class AgentRegistry {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private configs: Map<AgentType, AgentConfig> = new Map();

  constructor() {
    this.loadConfigs();
    this.initializeAgents();
  }

  /**
   * Load agent configurations from YAML file
   */
  private loadConfigs() {
    const configPath = path.join(__dirname, '../config/agents.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const allConfigs = yaml.load(fileContents) as Record<string, AgentConfig>;

    for (const [type, config] of Object.entries(allConfigs)) {
      this.configs.set(type as AgentType, config);
    }
  }

  /**
   * Initialize all agent instances
   */
  private initializeAgents() {
    const critiqueConfig = this.configs.get('critique');
    const craftConfig = this.configs.get('craft');
    const promptConfig = this.configs.get('prompt');

    if (critiqueConfig) {
      const provider = this.getProviderForAgent(critiqueConfig);
      this.agents.set('critique', new CritiqueAgent(critiqueConfig, provider));
    }

    if (craftConfig) {
      const provider = this.getProviderForAgent(craftConfig);
      this.agents.set('craft', new CraftAgent(craftConfig, provider));
    }

    if (promptConfig) {
      const provider = this.getProviderForAgent(promptConfig);
      this.agents.set('prompt', new PromptAgent(promptConfig, provider));
    }
  }

  /**
   * Get the appropriate AI provider for an agent
   */
  private getProviderForAgent(config: AgentConfig): IAIProvider {
    return getProvider(config.defaultProvider);
  }

  /**
   * Get an agent by type
   */
  getAgent(type: AgentType): BaseAgent | undefined {
    return this.agents.get(type);
  }

  /**
   * Get agent type from mention text
   * e.g., "@critique" -> "critique"
   */
  getAgentTypeFromMention(mention: string): AgentType | null {
    const normalized = mention.toLowerCase().replace('@', '');

    if (normalized.includes('critique')) return 'critique';
    if (normalized.includes('craft')) return 'craft';
    if (normalized.includes('prompt')) return 'prompt';

    return null;
  }

  /**
   * Get all available agent types
   */
  getAvailableAgents(): AgentType[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent info for display
   */
  getAgentInfo(type: AgentType): { name: string; description: string } | null {
    const config = this.configs.get(type);
    if (!config) return null;

    return {
      name: config.name,
      description: config.description,
    };
  }
}
