import express from 'express';
import dotenv from 'dotenv';
import { WhatsAppWebhookPayload, CRMType } from './types/index.js';
import { MessageProcessor } from './services/messageProcessor.js';
import { FileStorage } from './services/fileStorage.js';
import { RedisStorage } from './services/redisStorage.js';
import rateLimiter from './middleware/rateLimit.js';
import { IdempotencyMiddleware } from './middleware/idempotency.js';
import { ConfigManager } from './config/configManager.js';
import { AIProviderFactory } from './services/aiProviderFactory.js';
import { AIProviderConfig } from './types/aiProvider.js';

dotenv.config();

const configManager = new ConfigManager();

const preset = process.env.INDUSTRY_PRESET;
if (preset) {
  try {
    configManager.applyPreset(preset);
  } catch (error) {
    console.error(`Failed to apply preset: ${preset}`);
  }
}

if (configManager.getBoolean('SIMPLE_MODE', false)) {
  configManager.enableSimpleMode();
}

const app = express();
const PORT = configManager.getNumber('PORT', 3000);

const crmType = (configManager.get('CRM_TYPE') || 'hubspot') as CRMType;

const crmConfig = {
  type: crmType,
  apiKey: crmType === 'hubspot' ? configManager.get('HUBSPOT_API_KEY')! :
          crmType === 'salesforce' ? configManager.get('SALESFORCE_ACCESS_TOKEN')! :
          crmType === 'pipedrive' ? configManager.get('PIPEDRIVE_API_TOKEN')! :
          configManager.get('NOTION_ACCESS_TOKEN')!,
  instanceUrl: crmType === 'salesforce' ? configManager.get('SALESFORCE_INSTANCE_URL') :
                crmType === 'pipedrive' ? configManager.get('PIPEDRIVE_COMPANY_DOMAIN') :
                crmType === 'notion' ? configManager.get('NOTION_DATABASE_ID') : undefined
};

const shopifyConfig = configManager.get('SHOPIFY_STORE_URL') && configManager.get('SHOPIFY_ACCESS_TOKEN') ? {
  storeUrl: configManager.get('SHOPIFY_STORE_URL')!,
  accessToken: configManager.get('SHOPIFY_ACCESS_TOKEN')!
} : undefined;

const woocommerceConfig = configManager.get('WOOCOMMERCE_STORE_URL') && configManager.get('WOOCOMMERCE_CONSUMER_KEY') && configManager.get('WOOCOMMERCE_CONSUMER_SECRET') ? {
  storeUrl: configManager.get('WOOCOMMERCE_STORE_URL')!,
  consumerKey: configManager.get('WOOCOMMERCE_CONSUMER_KEY')!,
  consumerSecret: configManager.get('WOOCOMMERCE_CONSUMER_SECRET')!
} : undefined;

const calendarConfig = configManager.get('GOOGLE_CALENDAR_ACCESS_TOKEN') ? {
  accessToken: configManager.get('GOOGLE_CALENDAR_ACCESS_TOKEN')!,
  calendarId: configManager.get('GOOGLE_CALENDAR_ID')
} : undefined;

const whatsappConfig = configManager.getBoolean('ENABLE_AUTO_REPLY', false) ? {
  phoneNumberId: configManager.get('WHATSAPP_PHONE_NUMBER_ID')!,
  accessToken: configManager.get('WHATSAPP_ACCESS_TOKEN')!
} : undefined;

const storageType = configManager.get('STORAGE_TYPE') || 'file';
const storage = storageType === 'redis' && configManager.get('REDIS_URL') ?
  new RedisStorage(configManager.get('REDIS_URL')!) :
  new FileStorage(configManager.get('STORAGE_PATH') || './data');

const idempotency = new IdempotencyMiddleware(storage);

const productCatalog = configManager.get('PRODUCT_CATALOG') ? JSON.parse(configManager.get('PRODUCT_CATALOG')!) : undefined;
const summaryThreshold = configManager.getNumber('SUMMARY_THRESHOLD', 5);

const aiProviderConfig: AIProviderConfig = {
  type: (configManager.get('AI_PROVIDER') || 'openai') as any,
  apiKey: configManager.get('OPENAI_API_KEY') || configManager.get('ANTHROPIC_API_KEY') || configManager.get('GOOGLE_AI_API_KEY'),
  baseUrl: configManager.get('AI_BASE_URL'),
  model: configManager.get('AI_MODEL')
};

const aiProvider = AIProviderFactory.create(aiProviderConfig);

const processor = new MessageProcessor(
  aiProvider,
  crmConfig,
  shopifyConfig,
  woocommerceConfig,
  calendarConfig,
  whatsappConfig,
  storage,
  productCatalog,
  summaryThreshold
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

// Dashboard metrics endpoint
app.get('/dashboard', (req, res) => {
  const metrics = processor.getDashboardMetrics();
  res.json(metrics);
});

// Top intents endpoint
app.get('/dashboard/intents', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const intents = processor.getTopIntents(limit);
  res.json(intents);
});

// Sentiment trend endpoint
app.get('/dashboard/sentiment-trend', (req, res) => {
  const trend = processor.getSentimentTrend();
  res.json(trend);
});

// Export metrics endpoint
app.get('/dashboard/export', (req, res) => {
  const format = (req.query.format as string) || 'json';
  const contentType = format === 'csv' ? 'text/csv' : 'application/json';
  const data = processor.exportMetrics(format as 'json' | 'csv');
  res.setHeader('Content-Type', contentType);
  res.send(data);
});

// Conversation summary endpoint
app.get('/summary/:phone', async (req, res) => {
  try {
    const summary = await processor.getConversationSummary(req.params.phone);
    if (summary) {
      res.json(summary);
    } else {
      res.status(404).json({ error: 'No summary found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve summary' });
  }
});

// Learn writing style from messages
app.post('/style/learn/:phone', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length < 3) {
      return res.status(400).json({ error: 'Need at least 3 messages' });
    }
    const style = await processor.learnStyle(req.params.phone, messages);
    res.json({ success: true, style });
  } catch (error) {
    res.status(500).json({ error: 'Failed to learn style' });
  }
});

// Enable styled auto-reply for a phone
app.post('/style/enable/:phone', async (req, res) => {
  try {
    await processor.enableStyledAutoReply(req.params.phone);
    res.json({ success: true, message: 'Styled auto-reply enabled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable auto-reply' });
  }
});

// Disable styled auto-reply for a phone
app.post('/style/disable/:phone', async (req, res) => {
  try {
    await processor.disableStyledAutoReply(req.params.phone);
    res.json({ success: true, message: 'Styled auto-reply disabled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable auto-reply' });
  }
});

// Check if styled auto-reply is enabled
app.get('/style/status/:phone', async (req, res) => {
  try {
    const enabled = await processor.isStyledAutoReplyEnabled(req.params.phone);
    res.json({ enabled });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Setup endpoints
app.get('/setup/presets', (req, res) => {
  res.json({ presets: configManager.getAllPresets() });
});

app.get('/setup/preset/:name', (req, res) => {
  configManager.printPresetInfo(req.params.name);
  res.json({ preset: req.params.name });
});

app.get('/setup/guide', (req, res) => {
  configManager.printSetupGuide();
  res.json({ message: 'Setup guide printed to console' });
});

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp CRM Sync server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
});
