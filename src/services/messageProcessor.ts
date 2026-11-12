import { WhatsAppMessage, ExtractedCustomerInfo } from '../types/index.js';
import { AIAnalyzer } from './aiAnalyzer.js';
import { HubSpotIntegration } from '../integrations/hubspot.js';

export class MessageProcessor {
  private aiAnalyzer: AIAnalyzer;
  private hubspot: HubSpotIntegration;
  private conversationHistory: Map<string, string[]> = new Map();

  constructor(openaiKey: string, hubspotKey: string) {
    this.aiAnalyzer = new AIAnalyzer(openaiKey);
    this.hubspot = new HubSpotIntegration(hubspotKey);
  }

  async processMessage(message: WhatsAppMessage, contactName?: string): Promise<void> {
    const phone = message.from;
    const text = message.text?.body || '';

    if (!text) return;

    console.log(`Processing message from ${phone}: ${text}`);

    // Track conversation history
    const history = this.conversationHistory.get(phone) || [];
    history.push(text);
    this.conversationHistory.set(phone, history.slice(-10)); // Keep last 10 messages

    try {
      // Extract customer info using AI
      const customerInfo: ExtractedCustomerInfo = await this.aiAnalyzer.extractCustomerInfo(text, history);

      // Add contact name from WhatsApp if available
      if (contactName && !customerInfo.name) {
        customerInfo.name = contactName;
      }

      // Sync to HubSpot
      const contactId = await this.hubspot.findOrCreateContact(phone, customerInfo);

      // Log the conversation
      await this.hubspot.logConversation(contactId, text, true);

      // Update contact with extracted info
      if (Object.keys(customerInfo).length > 0) {
        await this.hubspot.updateContact(contactId, customerInfo);
      }

      console.log(`Successfully processed and synced message from ${phone}`);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  async classifyMessage(message: string): Promise<string> {
    return await this.aiAnalyzer.classifyIntent(message);
  }
}
