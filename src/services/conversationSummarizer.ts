export interface ConversationSummary {
  phone: string;
  customerName?: string;
  summary: string;
  keyPoints: string[];
  sentiment: string;
  urgency: string;
  messageCount: number;
  lastMessageTime: Date;
  actionItems?: string[];
}

export class ConversationSummarizer {
  private openai: any;

  constructor(openaiKey: string) {
    const OpenAI = require('openai');
    this.openai = new OpenAI({ apiKey: openaiKey });
  }

  async summarizeConversation(
    phone: string,
    messages: string[],
    customerName?: string,
    sentiment?: string,
    urgency?: string
  ): Promise<ConversationSummary> {
    const conversationText = messages.join('\n');

    const systemPrompt = `You are summarizing a WhatsApp conversation between a business and a customer.
Provide:
1. A brief summary (2-3 sentences)
2. Key points (bullet points)
3. Action items if any
Focus on what the customer wants, questions asked, and outcomes.
Be concise and professional.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: conversationText }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);

      return {
        phone,
        customerName,
        summary: parsed.summary || 'No summary available',
        keyPoints: parsed.keyPoints || [],
        sentiment: sentiment || 'neutral',
        urgency: urgency || 'normal',
        messageCount: messages.length,
        lastMessageTime: new Date(),
        actionItems: parsed.actionItems || []
      };
    } catch (error) {
      console.error('Summarization failed:', error);
      return {
        phone,
        customerName,
        summary: conversationText.slice(0, 200) + '...',
        keyPoints: [],
        sentiment: sentiment || 'neutral',
        urgency: urgency || 'normal',
        messageCount: messages.length,
        lastMessageTime: new Date()
      };
    }
  }

  formatSummaryForDelivery(summary: ConversationSummary): string {
    let text = `📱 Conversation Summary\n`;
    text += `--------------------------\n`;
    text += `Customer: ${summary.customerName || 'Unknown'} (${summary.phone})\n`;
    text += `Messages: ${summary.messageCount}\n`;
    text += `Sentiment: ${summary.sentiment} | Urgency: ${summary.urgency}\n\n`;
    text += `Summary:\n${summary.summary}\n\n`;

    if (summary.keyPoints.length > 0) {
      text += `Key Points:\n`;
      summary.keyPoints.forEach(point => {
        text += `• ${point}\n`;
      });
      text += '\n';
    }

    if (summary.actionItems && summary.actionItems.length > 0) {
      text += `Action Items:\n`;
      summary.actionItems.forEach(item => {
        text += `📋 ${item}\n`;
      });
    }

    return text;
  }
}
