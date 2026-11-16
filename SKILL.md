---
name: ChatFlow
description: Comprehensive WhatsApp Business automation suite for CRM sync, order processing, appointments, and AI-powered insights
---

# ChatFlow

A powerful WhatsApp Business automation tool that syncs conversations to CRM, processes orders, books appointments, and provides AI-powered conversation insights.

## What It Does

- **CRM Integration**: Sync conversations to HubSpot, Salesforce, Pipedrive, or Notion
- **Order Processing**: Create orders in Shopify or WooCommerce from WhatsApp messages
- **Appointment Booking**: Schedule appointments in Google Calendar with conflict detection
- **AI Summarization**: Auto-generate conversation summaries after N messages
- **Style Learning**: Learn your writing style and auto-reply in your voice
- **Analytics Dashboard**: Track metrics, sentiment trends, and export data
- **Workflow Automation**: Trigger-based actions for automation

## Requirements

- Node.js 18+
- WhatsApp Business API account (Meta Business Suite)
- OpenAI API key (for AI features)
- Public HTTPS server (for webhook)

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```env
   OPENAI_API_KEY=your_openai_key
   WHATSAPP_PHONE_NUMBER_ID=your_phone_id
   WHATSAPP_ACCESS_TOKEN=your_access_token
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_token
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Setup Instructions

### WhatsApp Webhook

1. Go to Meta for Developers and set up webhook:
   - Webhook URL: `https://your-domain.com/webhook`
   - Verify Token: Use your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - Subscribe to: `messages` field

2. See [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) for detailed guide.

### CRM Integration (Optional)

Choose one CRM and configure in `.env`:

**HubSpot:**
```env
CRM_TYPE=hubspot
HUBSPOT_API_KEY=your_api_key
```

**Salesforce:**
```env
CRM_TYPE=salesforce
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com
SALESFORCE_ACCESS_TOKEN=your_token
```

**Pipedrive:**
```env
CRM_TYPE=pipedrive
PIPEDRIVE_API_TOKEN=your_token
PIPEDRIVE_COMPANY_DOMAIN=your-company.pipedrive.com
```

**Notion:**
```env
CRM_TYPE=notion
NOTION_ACCESS_TOKEN=your_token
NOTION_DATABASE_ID=your_database_id
```

### E-commerce (Optional)

**Shopify:**
```env
SHOPIFY_STORE_URL=https://your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_token
```

**WooCommerce:**
```env
WOOCOMMERCE_STORE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=your_key
WOOCOMMERCE_CONSUMER_SECRET=your_secret
```

### Google Calendar (Optional)

```env
GOOGLE_CALENDAR_ACCESS_TOKEN=your_token
GOOGLE_CALENDAR_ID=primary
```

## Quick Start with Industry Presets

Set `INDUSTRY_PRESET` in `.env` for pre-configured settings:

- `retail` - E-commerce with orders and CRM
- `services` - Appointments and lead qualification
- `restaurant` - Reservations and quick responses
- `support` - Ticket routing and escalation
- `simple` - Basic summarization without integrations

Or enable `SIMPLE_MODE=true` for minimal setup.

## API Endpoints

### Webhook
- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive WhatsApp messages

### Analytics
- `GET /dashboard` - Full dashboard metrics
- `GET /dashboard/export?format=csv` - Export metrics

### Conversation
- `GET /summary/:phone` - Get conversation summary

### Style Learning
- `POST /style/learn/:phone` - Learn writing style from messages
- `POST /style/enable/:phone` - Enable styled auto-reply
- `POST /style/disable/:phone` - Disable styled auto-reply

### Setup
- `GET /setup/presets` - List industry presets
- `GET /setup/guide` - Print setup guide

### Health
- `GET /health` - Health check

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI features |
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | WhatsApp Business phone number ID |
| `WHATSAPP_ACCESS_TOKEN` | Yes | WhatsApp Business API access token |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Yes | Random token for webhook verification |
| `INDUSTRY_PRESET` | No | Industry preset (retail, services, restaurant, support, simple) |
| `SIMPLE_MODE` | No | Enable simple mode (minimal setup) |
| `CRM_TYPE` | No | CRM provider (hubspot, salesforce, pipedrive, notion) |
| `SUMMARY_THRESHOLD` | No | Messages before summarization (default: 5) |
| `ENABLE_AUTO_REPLY` | No | Enable auto-reply (default: false) |
| `STORAGE_PATH` | No | File storage path (default: ./data) |
| `REDIS_URL` | No | Redis URL for distributed storage |
| `PORT` | No | Server port (default: 3000) |

## Use Cases

### Retail Business
- Sync customer conversations to CRM
- Create orders from WhatsApp messages
- Track customer sentiment and urgency
- Auto-reply in brand voice

### Service Business
- Book appointments via WhatsApp
- Sync to Google Calendar
- Lead qualification and routing
- Conversation summaries for follow-up

### Restaurant
- Take reservations via WhatsApp
- Check availability with conflict detection
- Quick automated responses
- No CRM needed

### Customer Support
- Route tickets to CRM
- Escalate urgent issues
- Track sentiment trends
- Style learning for consistent responses

## Troubleshooting

### Webhook Not Receiving Messages
- Verify webhook is configured in Meta Business Suite
- Check server is publicly accessible (HTTPS)
- Verify phone number ID matches
- Check server logs for errors

### CRM Sync Not Working
- Verify API credentials are correct
- Check CRM API permissions
- Ensure `CRM_TYPE` is set correctly
- Check server logs for API errors

### AI Features Not Working
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI API quota
- Ensure API key has proper permissions

## Security Notes

- Keep all API keys secret
- Use strong webhook verify token
- Enable HTTPS in production
- Rate limiting is built-in
- Consider adding signature verification

## License

MIT
