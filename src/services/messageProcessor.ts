import { WhatsAppMessage, ExtractedCustomerInfo, CRMType } from '../types/index.js';
import { OrderInfo } from '../types/order.js';
import { AIAnalyzer } from './aiAnalyzer.js';
import { HubSpotIntegration } from '../integrations/hubspot.js';
import { SalesforceIntegration } from '../integrations/salesforce.js';
import { ShopifyIntegration } from '../integrations/shopify.js';
import { LeadScorer } from './leadScorer.js';
import { GoogleCalendarIntegration } from '../integrations/googleCalendar.js';
import { CRMInterface } from './crmInterface.js';

export class MessageProcessor {
  private aiAnalyzer: AIAnalyzer;
  private crm: CRMInterface;
  private shopify?: ShopifyIntegration;
  private calendar?: GoogleCalendarIntegration;
  private leadScorer: LeadScorer;
  private conversationHistory: Map<string, string[]> = new Map();

  constructor(
    openaiKey: string,
    crmConfig: { type: CRMType; apiKey: string; instanceUrl?: string },
    shopifyConfig?: { storeUrl: string; accessToken: string },
    calendarConfig?: { accessToken: string; calendarId?: string }
  ) {
    this.aiAnalyzer = new AIAnalyzer(openaiKey);
    this.leadScorer = new LeadScorer();

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
  }

  async extractOrderInfo(message: string): Promise<OrderInfo | null> {
    const systemPrompt = `Extract order information from WhatsApp message. Return JSON with:
- products: array of {name, quantity, variant, price}
- customer: {name, email, phone, address}
- notes: any additional instructions
Return null if no order detected.`;

    try {
      const response = await this.aiAnalyzer['openai'].chat.completions.create({
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
        }
      }

      if (this.calendar) {
        const appointment = await this.aiAnalyzer.extractAppointmentInfo(text);
        if (appointment) {
          const eventId = await this.calendar.createAppointment(appointment);
          console.log(`Created calendar event: ${eventId}`);
          await this.crm.logConversation(contactId, `Scheduled appointment: ${appointment.title}`, false);
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
}
