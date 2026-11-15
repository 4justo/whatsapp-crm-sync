import { AIProvider, AIProviderConfig, AIProviderType } from '../types/aiProvider.js';

export class AIProviderFactory {
  static create(config: AIProviderConfig): AIProvider {
    switch (config.type) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'google':
        return new GoogleProvider(config);
      case 'local':
        return new LocalProvider(config);
      default:
        throw new Error(`Unknown AI provider: ${config.type}`);
    }
  }
}

class OpenAIProvider implements AIProvider {
  private client: any;
  private model: string;

  constructor(config: AIProviderConfig) {
    const OpenAI = require('openai');
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gpt-4o-mini';
  }

  get chatCompletions() {
    return {
      create: async (params: any) => {
        const response = await this.client.chat.completions.create({
          model: this.model,
          messages: params.messages,
          temperature: params.temperature,
          response_format: params.response_format
        });
        return response;
      }
    };
  }
}

class AnthropicProvider implements AIProvider {
  private client: any;
  private model: string;

  constructor(config: AIProviderConfig) {
    const Anthropic = require('@anthropic-ai/sdk');
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-3-haiku-20240307';
  }

  get chatCompletions() {
    return {
      create: async (params: any) => {
        const isJson = params.response_format?.type === 'json_object';
        const system = params.messages.find((m: any) => m.role === 'system')?.content || '';
        const userMessages = params.messages.filter((m: any) => m.role !== 'system');

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 1024,
          system,
          messages: userMessages,
          temperature: params.temperature
        });

        return {
          choices: [{
            message: {
              content: response.content[0]?.text || ''
            }
          }]
        };
      }
    };
  }
}

class GoogleProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey!;
    this.model = config.model || 'gemini-1.5-flash';
  }

  get chatCompletions() {
    return {
      create: async (params: any) => {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: params.messages.map((m: any) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
              })),
              generationConfig: {
                temperature: params.temperature
              }
            })
          }
        );

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
          choices: [{
            message: { content }
          }]
        };
      }
    };
  }
}

class LocalProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.model = config.model || 'llama3.2';
  }

  get chatCompletions() {
    return {
      create: async (params: any) => {
        const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            messages: params.messages,
            temperature: params.temperature,
            format: params.response_format?.type === 'json_object' ? 'json' : undefined
          })
        });

        const data = await response.json();
        return data;
      }
    };
  }
}
