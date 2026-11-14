import express from 'express';
import dotenv from 'dotenv';
import { WhatsAppWebhookPayload, CRMType } from './types/index.js';
import { MessageProcessor } from './services/messageProcessor.js';
import { FileStorage } from './services/fileStorage.js';
import { RedisStorage } from './services/redisStorage.js';
import rateLimiter from './middleware/rateLimit.js';
import { IdempotencyMiddleware } from './middleware/idempotency.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const crmType = (process.env.CRM_TYPE || 'hubspot') as CRMType;

const crmConfig = {
  type: crmType,
  apiKey: crmType === 'hubspot' ? process.env.HUBSPOT_API_KEY! : 
          crmType === 'salesforce' ? process.env.SALESFORCE_ACCESS_TOKEN! :
          crmType === 'pipedrive' ? process.env.PIPEDRIVE_API_TOKEN! :
          process.env.NOTION_ACCESS_TOKEN!,
  instanceUrl: crmType === 'salesforce' ? process.env.SALESFORCE_INSTANCE_URL : 
                crmType === 'pipedrive' ? process.env.PIPEDRIVE_COMPANY_DOMAIN :
                crmType === 'notion' ? process.env.NOTION_DATABASE_ID : undefined
};

const shopifyConfig = process.env.SHOPIFY_STORE_URL && process.env.SHOPIFY_ACCESS_TOKEN ? {
  storeUrl: process.env.SHOPIFY_STORE_URL,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
} : undefined;

const woocommerceConfig = process.env.WOOCOMMERCE_STORE_URL && process.env.WOOCOMMERCE_CONSUMER_KEY && process.env.WOOCOMMERCE_CONSUMER_SECRET ? {
  storeUrl: process.env.WOOCOMMERCE_STORE_URL,
  consumerKey: process.env.WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: process.env.WOOCOMMERCE_CONSUMER_SECRET
} : undefined;

const calendarConfig = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN ? {
  accessToken: process.env.GOOGLE_CALENDAR_ACCESS_TOKEN,
  calendarId: process.env.GOOGLE_CALENDAR_ID
} : undefined;

const whatsappConfig = process.env.ENABLE_AUTO_REPLY === 'true' ? {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!
} : undefined;

const storage = process.env.REDIS_URL ? new RedisStorage(process.env.REDIS_URL) : new FileStorage(process.env.STORAGE_PATH || './data');

const idempotency = new IdempotencyMiddleware(storage);

const processor = new MessageProcessor(
  process.env.OPENAI_API_KEY!,
  crmConfig,
  shopifyConfig,
  woocommerceConfig,
  calendarConfig,
  whatsappConfig,
  storage
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter.middleware());
app.use(idempotency.middleware());

// Store raw body for signature verification (future)
app.use((req, res, next) => {
  req.body = req.body;
  next();
});

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook endpoint (POST)
app.post('/webhook', async (req, res) => {
  try {
    const payload = req.body as WhatsAppWebhookPayload;

    console.log('Received webhook:', JSON.stringify(payload, null, 2));

    // Acknowledge immediately
    res.sendStatus(200);

    // Process messages
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages') {
          const phoneNumberId = change.value?.metadata?.phone_number_id;

          if (phoneNumberId !== process.env.WHATSAPP_PHONE_NUMBER_ID) {
            console.log('Ignoring message for different phone number');
            continue;
          }

          const contacts = change.value?.contacts || [];
          const messages = change.value?.messages || [];

          for (const message of messages) {
            const contact = contacts.find(c => c.wa_id === message.from);
            const contactName = contact?.profile?.name;

            await processor.processMessage(message, contactName);
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Analytics endpoint
app.get('/analytics', (req, res) => {
  const analytics = processor.getAnalytics();
  res.json(analytics);
});

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp CRM Sync server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
});
