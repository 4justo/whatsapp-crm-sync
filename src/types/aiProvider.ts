export interface AIProvider {
  chatCompletions: {
    create(params: ChatCompletionParams): Promise<ChatCompletionResponse>;
  };
}

export interface ChatCompletionParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export interface ChatCompletionResponse {
  choices: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'local';

export interface AIProviderConfig {
  type: AIProviderType;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}
