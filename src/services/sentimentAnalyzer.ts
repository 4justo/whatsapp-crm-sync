import { AIProvider } from '../types/aiProvider.js';

export class SentimentAnalyzer {
  private aiProvider: AIProvider;

  constructor(aiProvider: AIProvider) {
    this.aiProvider = aiProvider;
  }

  async analyzeSentiment(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions?: string[];
  }> {
    const systemPrompt = `Analyze the sentiment of this WhatsApp message. Return JSON with:
- sentiment: "positive", "neutral", or "negative"
- confidence: number between 0 and 1
- emotions: array of detected emotions (e.g., "happy", "frustrated", "angry", "confused", "excited")`;

    try {
      const response = await this.aiProvider.chatCompletions.create({
        model: 'default',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { sentiment: 'neutral', confidence: 0.5 };
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return { sentiment: 'neutral', confidence: 0.5 };
    }
  }

  async detectUrgency(message: string): Promise<{
    isUrgent: boolean;
    urgencyLevel: 'low' | 'medium' | 'high';
    reason?: string;
  }> {
    const systemPrompt = `Detect if this WhatsApp message indicates urgency. Return JSON with:
- isUrgent: boolean
- urgencyLevel: "low", "medium", or "high"
- reason: brief explanation if urgent`;

    try {
      const response = await this.aiProvider.chatCompletions.create({
        model: 'default',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return { isUrgent: false, urgencyLevel: 'low' };
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Urgency detection failed:', error);
      return { isUrgent: false, urgencyLevel: 'low' };
    }
  }
}
