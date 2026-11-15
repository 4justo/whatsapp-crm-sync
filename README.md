# WhatsApp CRM Sync

A comprehensive WhatsApp Business automation suite for syncing conversations to CRM, processing orders, booking appointments, and providing AI-powered insights.

## Features

- **CRM Integration**: HubSpot, Salesforce, Pipedrive, Notion
- **E-commerce**: Shopify, WooCommerce order processing
- **Appointments**: Google Calendar with conflict detection
- **AI-Powered**:
  - Conversation summarization
  - Style learning for personalized auto-replies
  - Sentiment and urgency detection
  - Intent classification
- **Analytics Dashboard**: Metrics, trends, and export
- **Workflow Automation**: Trigger-based actions
- **Industry Presets**: Retail, Services, Restaurant, Support, Simple mode

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
OPENAI_API_KEY=your_openai_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_token
```

### 3. Choose Industry Preset (Optional)

Set `INDUSTRY_PRESET` in `.env`:
- `retail` - E-commerce focus
- `services` - Appointment booking focus
- `restaurant` - Reservation focus
- `support` - Customer service focus
- `simple` - Basic automation

Or enable `SIMPLE_MODE=true` for minimal setup.

### 4. Start the Server

```bash
npm start
```

### 5. Set Up Webhook

See [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) for detailed instructions.

## API Endpoints

### Webhook
- `GET /webhook` - Webhook verification
- `POST /webhook` - Receive WhatsApp messages

### Analytics
- `GET /analytics` - Basic metrics
- `GET /dashboard` - Full dashboard metrics
- `GET /dashboard/intents?limit=5` - Top intents
- `GET /dashboard/sentiment-trend` - Sentiment trend
- `GET /dashboard/export?format=csv` - Export metrics

### Conversation
- `GET /summary/:phone` - Get conversation summary

### Style Learning
- `POST /style/learn/:phone` - Learn writing style
- `POST /style/enable/:phone` - Enable styled auto-reply
- `POST /style/disable/:phone` - Disable styled auto-reply
- `GET /style/status/:phone` - Check auto-reply status

### Setup
- `GET /setup/presets` - List industry presets
- `GET /setup/preset/:name` - Get preset details
- `GET /setup/guide` - Print setup guide

### Health
- `GET /health` - Health check

## Configuration

### CRM (choose one)
- `CRM_TYPE=hubspot` with `HUBSPOT_API_KEY`
- `CRM_TYPE=salesforce` with `SALESFORCE_INSTANCE_URL` and `SALESFORCE_ACCESS_TOKEN`
- `CRM_TYPE=pipedrive` with `PIPEDRIVE_API_TOKEN` and `PIPEDRIVE_COMPANY_DOMAIN`
- `CRM_TYPE=notion` with `NOTION_ACCESS_TOKEN` and `NOTION_DATABASE_ID`

### E-commerce (optional)
- Shopify: `SHOPIFY_STORE_URL`, `SHOPIFY_ACCESS_TOKEN`
- WooCommerce: `WOOCOMMERCE_STORE_URL`, `WOOCOMMERCE_CONSUMER_KEY`, `WOOCOMMERCE_CONSUMER_SECRET`

### Calendar (optional)
- Google Calendar: `GOOGLE_CALENDAR_ACCESS_TOKEN`, `GOOGLE_CALENDAR_ID`

### Storage (optional)
- File storage: `STORAGE_PATH=./data` (default)
- Redis: `REDIS_URL=redis://localhost:6379`

### AI Features
- Summarization: `SUMMARY_THRESHOLD=5`
- Style learning: `STYLE_LEARNING_ENABLED=true`
- Auto-reply: `ENABLE_AUTO_REPLY=true`

## Architecture

```
WhatsApp Message
    ↓
MessageProcessor
    ↓
├── AI Analysis (intent, sentiment, urgency, extraction)
├── CRM Sync (contact creation, conversation logging)
├── Order Processing (Shopify, WooCommerce)
├── Appointment Booking (Google Calendar)
├── Workflow Execution (trigger-based actions)
├── Style Learning (personalized replies)
└── Analytics (metrics tracking)
```

## Development

```bash
npm run dev  # Watch mode with tsx
npm test     # Run tests
```

## License

MIT
