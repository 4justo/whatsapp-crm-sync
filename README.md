# WhatsApp CRM Sync

Automatically sync WhatsApp Business conversations to HubSpot CRM using AI-powered message analysis.

## Features (MVP)

- ✅ Receive WhatsApp messages via Business API webhook
- ✅ AI-powered customer information extraction (name, email, company, intent, etc.)
- ✅ Automatic HubSpot contact creation/updates
- ✅ Conversation logging in HubSpot
- ✅ Intent classification for routing

## Setup

### Prerequisites

- Node.js 20+
- WhatsApp Business API account
- HubSpot account with API key
- OpenAI API key

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in required environment variables:
   - `WHATSAPP_PHONE_NUMBER_ID`: From Meta Developers
   - `WHATSAPP_ACCESS_TOKEN`: From Meta Developers
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`: Your chosen token
   - `HUBSPOT_API_KEY`: From HubSpot Settings
   - `OPENAI_API_KEY`: From OpenAI

### Running

```bash
npm run dev
```

Server starts on `http://localhost:3000`

### Webhook Setup

1. Configure your WhatsApp Business API webhook URL:
   ```
   https://your-domain.com/webhook
   ```
2. Set verify token to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

## How It Works

1. Customer sends WhatsApp message
2. Webhook receives message
3. AI extracts customer information (name, email, company, intent, pain points, budget, timeline)
4. HubSpot:
   - Finds or creates contact
   - Logs conversation as note
   - Updates contact with extracted info

## Roadmap

- [ ] Order processing (Shopify, WooCommerce)
- [ ] Lead qualification and scoring
- [ ] Appointment booking (Google Calendar)
- [ ] Additional CRM integrations (Salesforce, Pipedrive)
- [ ] Workflow builder
- [ ] Analytics dashboard
