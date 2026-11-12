# WhatsApp CRM Sync

**AI-powered automation that syncs WhatsApp Business conversations to HubSpot CRM in real-time.**

Never lose a customer conversation again. Automatically extract customer information, classify intent, and sync everything to your CRM - no manual data entry required.

## 🎯 The Problem

Businesses today lose valuable customer data because:
- WhatsApp conversations happen in isolation from CRM systems
- Sales teams waste hours manually copying conversations
- Customer intent and pain points are never captured
- Follow-ups happen too late or not at all

## ✨ The Solution

This tool automatically:
- **Extracts customer info** from WhatsApp messages using AI (name, email, company, budget, timeline)
- **Classifies intent** (product inquiry, support request, sales lead, appointment)
- **Syncs to HubSpot** - creates contacts, logs conversations, updates properties
- **Tracks history** across all conversations for context
- **Routes leads** based on customer needs

## 🚀 Use Cases

- **Sales teams**: Capture leads from WhatsApp, extract budget/timeline, route to right rep
- **Support teams**: Log all customer conversations, identify pain points, track issues
- **E-commerce**: Convert WhatsApp inquiries to HubSpot deals automatically
- **Service businesses**: Book appointments from WhatsApp, sync customer details
- **Consultants**: Manage client conversations, track requirements, follow up automatically

## ✅ Current Features (MVP)

- **WhatsApp Business API Integration**
  - Real-time webhook receiver
  - Message parsing and validation
  - Webhook signature verification

- **AI-Powered Analysis**
  - Extract customer information (name, email, phone, company)
  - Identify customer intent (inquiry, support, sales, appointment)
  - Detect pain points, budget, timeline
  - Conversation history tracking

- **HubSpot CRM Integration**
  - Automatic contact creation/finding by phone
  - Conversation logging as engagement notes
  - Contact property updates
  - Two-way data sync ready

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

```bash
# WhatsApp Business API (from Meta Developers)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secret_token

# HubSpot CRM (from HubSpot Settings → Integrations → API Key)
HUBSPOT_API_KEY=your_hubspot_api_key

# OpenAI (from platform.openai.com)
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=3000
```

### Get Your Credentials

**WhatsApp Business API:**
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a WhatsApp Business App
3. Get Phone Number ID and Access Token
4. Choose a Webhook Verify Token (any secret string)

**HubSpot API Key:**
1. Go to HubSpot → Settings → Integrations → API Key
2. Create private app or generate API key

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key in API keys section

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

## 💡 How It Works

```
Customer sends WhatsApp message
         ↓
Webhook receives message
         ↓
AI analyzes message
├─ Extracts: name, email, company, phone
├─ Identifies: intent, pain points, budget, timeline
└─ Tracks: conversation history
         ↓
HubSpot CRM
├─ Finds or creates contact
├─ Logs conversation as note
└─ Updates contact properties
         ↓
Sales/Support team sees complete customer context
```

## 🛠️ Tech Stack

- **Node.js + TypeScript** - Fast, type-safe runtime
- **Express** - Web server for webhook handling
- **OpenAI GPT-4o-mini** - AI-powered message analysis
- **HubSpot API** - CRM integration
- **WhatsApp Business API** - Message receiving

## 📦 Installation

## 🗺️ Roadmap

### Phase 2: Order Processing
- [ ] Shopify integration - create orders from WhatsApp
- [ ] WooCommerce integration
- [ ] Square integration
- [ ] Automatic order confirmation via WhatsApp
- [ ] Inventory updates

### Phase 3: Lead Management
- [ ] Lead scoring based on conversation
- [ ] Automatic lead routing to sales reps
- [ ] Follow-up scheduling
- [ ] Pipeline stage progression
- [ ] Lead qualification criteria

### Phase 4: Appointment Booking
- [ ] Google Calendar integration
- [ ] Calendly integration
- [ ] Natural language time parsing
- [ ] Automatic calendar invites
- [ ] Reminder notifications

### Phase 5: Advanced Features
- [ ] Additional CRM integrations (Salesforce, Pipedrive, Notion)
- [ ] Visual workflow builder
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Sentiment analysis
- [ ] WhatsApp message sending (two-way sync)

## 🤝 Contributing

Contributions welcome! This is an active project with a clear roadmap. Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests
- Suggest new integrations

## 📄 License

MIT License - feel free to use this for personal or commercial projects.

## 🆘 Support

- Open an issue on GitHub
- Check existing issues for solutions
- Review setup guide in README

## 🌟 Star History

If this project helps you, please consider giving it a star!
