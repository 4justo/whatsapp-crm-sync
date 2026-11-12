import { WhatsAppMessage, ExtractedCustomerInfo, CRMType } from '../types/index.js';
import { OrderInfo } from '../types/order.js';
import { AIAnalyzer } from './aiAnalyzer.js';
import { HubSpotIntegration } from '../integrations/hubspot.js';
import { SalesforceIntegration } from '../integrations/salesforce.js';
import { ShopifyIntegration } from '../integrations/shopify.js';
import { LeadScorer } from './leadScorer.js';
import { GoogleCalendarIntegration } from '../integrations/googleCalendar.js';
import { CRMInterface } from './crmInterface.js';
import { AnalyticsService } from './analytics.js';
import { SentimentAnalyzer } from './sentimentAnalyzer.js';
import { WhatsAppSender } from '../integrations/whatsappSender.js';

export class MessageProcessor {
  private aiAnalyzer: AIAnalyzer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private crm: CRMInterface;
  private shopify?: ShopifyIntegration;
  private calendar?: GoogleCalendarIntegration;
  private whatsappSender?: WhatsAppSender;
  private leadScorer: LeadScorer;
  private analytics: AnalyticsService;
  private conversationHistory: Map<string, string[]> = new Map();

  constructor(
    openaiKey: string,
    crmConfig: { type: CRMType; apiKey: string; instanceUrl?: string },
    shopifyConfig?: { storeUrl: string; accessToken: string },
    calendarConfig?: { accessToken: string; calendarId?: string },
    whatsappConfig?: { phoneNumberId: string; accessToken: string }
  ) {
    this.aiAnalyzer = new AIAnalyzer(openaiKey);
    this.sentimentAnalyzer = new SentimentAnalyzer(openaiKey);
    this.leadScorer = new LeadScorer();
    this.analytics = new AnalyticsService();

    if (crmConfig.type === 'hubspot') {
      this.crm = new HubSpotIntegration(crmConfig.apiKey);
    } else if (crmConfig.type === 'salesforce') {
      this.crm = new SalesforceIntegration(crmConfig.instanceUrl!, crmConfig.apiKey);
    }

    if (shopifyConfig) {
      this.shopify = new ShopifyIntegration(shopifyConfig.storeUrl, shopifyConfig.accessToken);
    }
    if (calendarConfig) {
      this.calendar = new GoogleCalendarIntegration(calendarConfig.accessToken, calendarConfig.calendarId);
    }
    if (whatsappConfig) {
      this.whatsappSender = new WhatsAppSender(whatsappConfig.phoneNumberId, whatsappConfig.accessToken);
    }
  }

  async extractOrderInfo(message: string): Promise<OrderInfo | null> {
    const systemPrompt = `Extract order information from WhatsApp message. Return JSON with:
- products: array of {name, quantity, variant, price}
- customer: {name, email, phone, address}
- notes: any additional instructions
Return null if no order detected.`;

    try {
      const response = await this.aiAnalyzer.getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return null;

      const order = JSON.parse(content) as OrderInfo;
      if (order.products && order.products.length > 0) {
        return order;
      }
      return null;
    } catch (error) {
      console.error('Order extraction failed:', error);
      return null;
    }
  }

  async processMessage(message: WhatsAppMessage, contactName?: string): Promise<void> {
    const phone = message.from;
    const text = message.text?.body || '';

    if (!text) return;

    console.log(`Processing message from ${phone}: ${text}`);

    const history = this.conversationHistory.get(phone) || [];
    history.push(text);
    this.conversationHistory.set(phone, history.slice(-10));

    try {
      const customerInfo: ExtractedCustomerInfo = await this.aiAnalyzer.extractCustomerInfo(text, history);

      const sentiment = await this.sentimentAnalyzer.analyzeSentiment(text);
      customerInfo.sentiment = sentiment.sentiment;

      const urgency = await this.sentimentAnalyzer.detectUrgency(text);
      customerInfo.urgency = urgency.urgencyLevel;

      if (urgency.isUrgent) {
        console.log(`URGENT message detected: ${urgency.reason}`);
      }

      if (contactName && !customerInfo.name) {
        customerInfo.name = contactName;
      }

      const contactId = await this.crm.findOrCreateContact(phone, customerInfo);
      await this.crm.logConversation(contactId, text, true);

      if (Object.keys(customerInfo).length > 0) {
        await this.crm.updateContact(contactId, customerInfo);
      }

      const leadScore = this.leadScorer.scoreLead(customerInfo);
      console.log(`Lead score: ${leadScore.score} (${leadScore.priority}) - ${leadScore.reasons.join(', ')}`);
      this.analytics.recordLead(leadScore.score);

      const assignedTo = this.leadScorer.assignLead(customerInfo);
      if (assignedTo) {
        console.log(`Lead assigned to: ${assignedTo}`);
        await this.crm.logConversation(contactId, `Lead assigned to ${assignedTo} (Score: ${leadScore.score})`, false);
      }

      if (this.shopify) {
        const order = await this.extractOrderInfo(text);
        if (order) {
          order.customer.phone = phone;
          const orderId = await this.shopify.createOrder(order);
          console.log(`Created Shopify order: ${orderId}`);
          await this.crm.logConversation(contactId, `Created Shopify order #${orderId}`, false);

          const orderValue = order.products.reduce((sum, p) => sum + (p.price || 0), 0);
          this.analytics.recordOrder(orderValue, order.products[0]?.name || 'unknown');
        }
      }

      if (this.calendar) {
        const appointment = await this.aiAnalyzer.extractAppointmentInfo(text);
        if (appointment) {
          const eventId = await this.calendar.createAppointment(appointment);
          console.log(`Created calendar event: ${eventId}`);
          await this.crm.logConversation(contactId, `Scheduled appointment: ${appointment.title}`, false);
          this.analytics.recordAppointment(appointment.startTime);
        }
      }

      const intent = await this.aiAnalyzer.classifyIntent(text);
      this.analytics.recordMessage(intent);

      if (this.whatsappSender) {
        if (urgency.isUrgent || sentiment.sentiment === 'negative') {
          const autoReply = this.generateAutoReply(urgency, sentiment, customerInfo);
          await this.whatsappSender.sendTextMessage(phone, autoReply);
          console.log(`Sent auto-reply to ${phone}`);
          await this.crm.logConversation(contactId, `Auto-reply sent: ${autoReply}`, false);
        }
      }

      console.log(`Successfully processed and synced message from ${phone}`);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  async classifyMessage(message: string): Promise<string> {
    return await this.aiAnalyzer.classifyIntent(message);
  }

  getAnalytics() {
    return this.analytics.getAnalytics();
  }

  private generateAutoReply(urgency: { isUrgent: boolean; urgencyLevel: string }, sentiment: { sentiment: string }, customerInfo: ExtractedCustomerInfo): string {
    if (urgency.isUrgent) {
      return `Thank you for your message. This has been flagged as urgent and our team will respond within 1 hour.`;
    }

    if (sentiment.sentiment === 'negative') {
      return `We're sorry to hear you're having trouble. A support specialist will review your case and reach out shortly to help resolve this.`;
    }

    return `Thanks for reaching out! We've received your message and someone from our team will get back to you soon.`;
  }
}
