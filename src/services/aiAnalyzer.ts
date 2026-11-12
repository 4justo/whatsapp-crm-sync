import OpenAI from 'openai';
import { ExtractedCustomerInfo } from '../types/index.js';

export class AIAnalyzer {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async extractCustomerInfo(message: string, conversationHistory: string[] = []): Promise<ExtractedCustomerInfo> {
    const systemPrompt = `You are a business intelligence assistant. Extract structured customer information from WhatsApp messages.
Extract: name, email, phone, company, intent (what they want), pain points (problems they mention), budget, timeline.
Return ONLY valid JSON. If a field is not found, omit it or set to null.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: `Recent messages:\n${conversationHistory.join('\n')}\n\nLatest message: ${message}` }
    ];

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content) as ExtractedCustomerInfo;
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {};
    }
  }

  async classifyIntent(message: string): Promise<string> {
    const systemPrompt = `Classify the intent of this WhatsApp message into one of these categories:
- "product_inquiry": Asking about products/services
- "support_request": Need help with existing product/service
- "sales_inquiry": Interest in purchasing
- "appointment_request": Wants to schedule meeting
- "general_question": General information
- "complaint": Dissatisfied customer
- "other": None of the above

Return ONLY the category name.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1
      });

      return response.choices[0]?.message?.content?.trim() || 'other';
    } catch (error) {
      console.error('Intent classification failed:', error);
      return 'other';
    }
  }
}
