import { StorageAdapter } from '../types/storage.js';

export interface MessageStyle {
  tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'urgent';
  emojiUsage: 'frequent' | 'moderate' | 'rare' | 'none';
  greetingPatterns: string[];
  closingPatterns: string[];
  typicalLength: 'short' | 'medium' | 'long';
  commonPhrases: string[];
  responseTime: 'immediate' | 'quick' | 'normal' | 'delayed';
}

export interface StyleProfile {
  phone: string;
  style: MessageStyle;
  sampleMessages: string[];
  lastUpdated: Date;
}

export class StyleLearner {
  private openai: any;
  private storage: StorageAdapter;
  private profiles: Map<string, StyleProfile> = new Map();

  constructor(openaiKey: string, storage: StorageAdapter) {
    const OpenAI = require('openai');
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.storage = storage;
  }

  async learnFromMessages(phone: string, messages: string[]): Promise<MessageStyle> {
    if (messages.length < 3) {
      throw new Error('Need at least 3 messages to learn style');
    }

    const systemPrompt = `Analyze these WhatsApp messages and extract the writing style.
Return JSON with:
- tone: formal/casual/friendly/professional/urgent
- emojiUsage: frequent/moderate/rare/none
- greetingPatterns: array of common greetings
- closingPatterns: array of common closings
- typicalLength: short/medium/long
- commonPhrases: array of frequently used phrases
- responseTime: immediate/quick/normal/delayed (estimate from patterns)`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: messages.join('\n---\n') }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const style = JSON.parse(content) as MessageStyle;

      const profile: StyleProfile = {
        phone,
        style,
        sampleMessages: messages.slice(-10),
        lastUpdated: new Date()
      };

      this.profiles.set(phone, profile);
      await this.storage.set(`style:${phone}`, JSON.stringify(profile));

      return style;
    } catch (error) {
      console.error('Style learning failed:', error);
      throw error;
    }
  }

  async loadProfile(phone: string): Promise<StyleProfile | null> {
    const cached = this.profiles.get(phone);
    if (cached) return cached;

    const stored = await this.storage.get(`style:${phone}`);
    if (stored) {
      const profile = JSON.parse(stored) as StyleProfile;
      this.profiles.set(phone, profile);
      return profile;
    }

    return null;
  }

  async generateStyledReply(
    phone: string,
    incomingMessage: string,
    context: string
  ): Promise<string> {
    const profile = await this.loadProfile(phone);
    if (!profile) {
      throw new Error('No style profile found for this phone');
    }

    const style = profile.style;

    const systemPrompt = `You are replying to a WhatsApp message as a business.
Match this writing style:
- Tone: ${style.tone}
- Emoji usage: ${style.emojiUsage}
- Typical length: ${style.typicalLength}
- Common phrases: ${style.commonPhrases.join(', ')}
- Greetings: ${style.greetingPatterns.join(', ')}
- Closings: ${style.closingPatterns.join(', ')}

Context: ${context}
Incoming message: ${incomingMessage}

Generate a natural, helpful response that matches the learned style.
Be concise and conversational.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: incomingMessage }
        ],
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Styled reply generation failed:', error);
      throw error;
    }
  }

  async enableAutoReply(phone: string): Promise<void> {
    await this.storage.set(`autoreply:${phone}`, 'true');
  }

  async disableAutoReply(phone: string): Promise<void> {
    await this.storage.delete(`autoreply:${phone}`);
  }

  async isAutoReplyEnabled(phone: string): Promise<boolean> {
    const enabled = await this.storage.get(`autoreply:${phone}`);
    return enabled === 'true';
  }

  async getAllProfiles(): Promise<StyleProfile[]> {
    return Array.from(this.profiles.values());
  }
}
