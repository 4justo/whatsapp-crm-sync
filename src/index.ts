import express from 'express';
import dotenv from 'dotenv';
import { WhatsAppWebhookPayload } from './types/index.js';
import { MessageProcessor } from './services/messageProcessor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Environment validation
const requiredEnvVars = ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'HUBSPOT_API_KEY', 'OPENAI_API_KEY'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

// Initialize message processor
const processor = new MessageProcessor(
  process.env.OPENAI_API_KEY!,
  process.env.HUBSPOT_API_KEY!
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp CRM Sync server running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
});
