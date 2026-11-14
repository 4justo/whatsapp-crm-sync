import { WhatsAppMessage, ExtractedCustomerInfo, CRMType } from '../types/index.js';
import { OrderInfo } from '../types/order.js';
import { AIAnalyzer } from './aiAnalyzer.js';
import { HubSpotIntegration } from '../integrations/hubspot.js';
import { SalesforceIntegration } from '../integrations/salesforce.js';
import { PipedriveIntegration } from '../integrations/pipedrive.js';
import { NotionIntegration } from '../integrations/notion.js';
import { ShopifyIntegration } from '../integrations/shopify.js';
import { WooCommerceIntegration } from '../integrations/woocommerce.js';
import { LeadScorer } from './leadScorer.js';
import { GoogleCalendarIntegration } from '../integrations/googleCalendar.js';
import { CRMInterface } from './crmInterface.js';
import { AnalyticsService } from './analytics.js';
import { SentimentAnalyzer } from './sentimentAnalyzer.js';
import { WhatsAppSender } from '../integrations/whatsappSender.js';
import { WorkflowEngine } from './workflowEngine.js';
import { WorkflowContext } from '../types/workflow.js';
import { StorageAdapter } from '../types/storage.js';
import { OrderParser } from './orderParser.js';
import { ConversationSummarizer, ConversationSummary } from './conversationSummarizer.js';
import { StyleLearner } from './styleLearner.js';
import { DashboardService } from './dashboard.js';

export class MessageProcessor {
  private aiAnalyzer: AIAnalyzer;
  private sentimentAnalyzer: SentimentAnalyzer;
  private crm: CRMInterface;
  private shopify?: ShopifyIntegration;
  private woocommerce?: WooCommerceIntegration;
  private calendar?: GoogleCalendarIntegration;
  private whatsappSender?: WhatsAppSender;
  private workflowEngine: WorkflowEngine;
  private leadScorer: LeadScorer;
  private analytics: AnalyticsService;
  private storage: StorageAdapter;
  private orderParser: OrderParser;
  private summarizer: ConversationSummarizer;
  private styleLearner: StyleLearner;
  private dashboard: DashboardService;
  private summaryThreshold: number;

  constructor(
    openaiKey: string,
    crmConfig: { type: CRMType; apiKey: string; instanceUrl?: string },
    shopifyConfig?: { storeUrl: string; accessToken: string },
    woocommerceConfig?: { storeUrl: string; consumerKey: string; consumerSecret: string },
    calendarConfig?: { accessToken: string; calendarId?: string },
    whatsappConfig?: { phoneNumberId: string; accessToken: string },
    storage: StorageAdapter,
    productCatalog?: Array<{ name: string; price: number; sku?: string }>,
    summaryThreshold: number = 5
  ) {
    this.aiAnalyzer = new AIAnalyzer(openaiKey);
    this.sentimentAnalyzer = new SentimentAnalyzer(openaiKey);
    this.leadScorer = new LeadScorer();
    this.analytics = new AnalyticsService();
    this.workflowEngine = new WorkflowEngine(whatsappConfig ? new WhatsAppSender(whatsappConfig.phoneNumberId, whatsappConfig.accessToken) : undefined);
    this.storage = storage;
    this.orderParser = new OrderParser(productCatalog);
    this.summarizer = new ConversationSummarizer(openaiKey);
    this.styleLearner = new StyleLearner(openaiKey, storage);
    this.dashboard = new DashboardService(this.analytics);
    this.summaryThreshold = summaryThreshold;

    if (crmConfig.type === 'hubspot') {
      this.crm = new HubSpotIntegration(crmConfig.apiKey);
    } else if (crmConfig.type === 'salesforce') {
      this.crm = new SalesforceIntegration(crmConfig.instanceUrl!, crmConfig.apiKey);
    } else if (crmConfig.type === 'pipedrive') {
      this.crm = new PipedriveIntegration(crmConfig.apiKey, crmConfig.instanceUrl!);
    } else if (crmConfig.type === 'notion') {
      this.crm = new NotionIntegration(crmConfig.apiKey, crmConfig.instanceUrl!);
    }

    if (shopifyConfig) {
      this.shopify = new ShopifyIntegration(shopifyConfig.storeUrl, shopifyConfig.accessToken);
    }
    if (woocommerceConfig) {
      this.woocommerce = new WooCommerceIntegration(woocommerceConfig.storeUrl, woocommerceConfig.consumerKey, woocommerceConfig.consumerSecret);
    }
    if (calendarConfig) {
      this.calendar = new GoogleCalendarIntegration(calendarConfig.accessToken, calendarConfig.calendarId);
    }
    if (whatsappConfig) {
      this.whatsappSender = new WhatsAppSender(whatsappConfig.phoneNumberId, whatsappConfig.accessToken);
    }
  }

  async extractOrderInfo(message: string): Promise<OrderInfo | null> {
    const parsedOrder = this.orderParser.parseFromMessage(message);
    if (parsedOrder) {
      return {
        products: parsedOrder.products,
        customer: { name: '', email: '', phone: '' },
        notes: parsedOrder.notes
      };
    }

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

    const historyKey = `conversation:${phone}`;
    const storedHistory = await this.storage.get(historyKey);
    const history = storedHistory ? JSON.parse(storedHistory) : [];
    history.push(text);
    await this.storage.set(historyKey, JSON.stringify(history.slice(-10)));

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
      this.dashboard.logActivity('contact', `Contact created/updated: ${phone}`);

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
          this.dashboard.logActivity('order', `Shopify order created: #${orderId}`);

          const orderValue = order.products.reduce((sum, p) => sum + (p.price || 0), 0);
          this.analytics.recordOrder(orderValue, order.products[0]?.name || 'unknown');
        }
      }

      if (this.woocommerce) {
        const order = await this.extractOrderInfo(text);
        if (order) {
          order.customer.phone = phone;
          const orderId = await this.woocommerce.createOrder(order);
          console.log(`Created WooCommerce order: ${orderId}`);
          await this.crm.logConversation(contactId, `Created WooCommerce order #${orderId}`, false);
          this.dashboard.logActivity('order', `WooCommerce order created: #${orderId}`);

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
          this.dashboard.logActivity('appointment', `Appointment scheduled: ${appointment.title}`);
          this.analytics.recordAppointment(appointment.startTime);
        }
      }

      const intent = await this.aiAnalyzer.classifyIntent(text);
      this.analytics.recordMessage(intent);

      const workflowContext: WorkflowContext = {
        message: text,
        intent,
        sentiment: sentiment.sentiment,
        urgency: urgency.urgencyLevel,
        customerInfo,
        contactId: contactId as number
      };

      await this.workflowEngine.executeWorkflows(workflowContext);

      if (this.whatsappSender) {
        if (urgency.isUrgent || sentiment.sentiment === 'negative') {
          const autoReply = this.generateAutoReply(urgency, sentiment, customerInfo);
          await this.whatsappSender.sendTextMessage(phone, autoReply);
          console.log(`Sent auto-reply to ${phone}`);
          await this.crm.logConversation(contactId, `Auto-reply sent: ${autoReply}`, false);
        }
      }

      if (history.length >= this.summaryThreshold) {
        const summary = await this.summarizer.summarizeConversation(
          phone,
          history,
          customerInfo.name,
          sentiment.sentiment,
          urgency.urgencyLevel
        );

        await this.storage.set(`summary:${phone}`, JSON.stringify(summary));
        console.log(`Generated conversation summary for ${phone}`);

        if (this.whatsappSender && process.env.SEND_SUMMARY_TO_BUSINESS === 'true') {
          const formattedSummary = this.summarizer.formatSummaryForDelivery(summary);
          await this.whatsappSender.sendTextMessage(process.env.BUSINESS_PHONE_NUMBER!, formattedSummary);
          console.log(`Sent summary to business phone`);
        }
      }

      const autoReplyEnabled = await this.styleLearner.isAutoReplyEnabled(phone);
      if (autoReplyEnabled && this.whatsappSender && this.summaryThreshold > 0) {
        try {
          const styledReply = await this.styleLearner.generateStyledReply(phone, text, JSON.stringify(customerInfo));
          await this.whatsappSender.sendTextMessage(phone, styledReply);
          console.log(`Sent styled auto-reply to ${phone}`);
          await this.crm.logConversation(contactId, `Styled auto-reply sent`, false);
        } catch (error) {
          console.error('Styled reply failed:', error);
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

  async getConversationSummary(phone: string): Promise<ConversationSummary | null> {
    const stored = await this.storage.get(`summary:${phone}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  }

  async learnStyle(phone: string, messages: string[]) {
    return await this.styleLearner.learnFromMessages(phone, messages);
  }

  async enableStyledAutoReply(phone: string) {
    await this.styleLearner.enableAutoReply(phone);
  }

  async disableStyledAutoReply(phone: string) {
    await this.styleLearner.disableAutoReply(phone);
  }

  async isStyledAutoReplyEnabled(phone: string): Promise<boolean> {
    return await this.styleLearner.isAutoReplyEnabled(phone);
  }

  getDashboardMetrics() {
    return this.dashboard.getMetrics();
  }

  getTopIntents(limit: number = 5) {
    return this.dashboard.getTopIntents(limit);
  }

  getSentimentTrend() {
    return this.dashboard.getSentimentTrend();
  }

  exportMetrics(format: 'json' | 'csv' = 'json') {
    return this.dashboard.exportMetrics(format);
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
