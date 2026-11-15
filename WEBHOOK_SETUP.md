# WhatsApp Webhook Setup Guide

This guide explains how to set up the WhatsApp Business webhook for the CRM Sync bot.

## Prerequisites

- WhatsApp Business API account (Meta Business Suite)
- A server with public HTTPS URL (ngrok for testing, or production domain)
- The bot running with proper environment variables

## Step 1: Configure Environment Variables

Add these to your `.env` file:

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_verify_token
ENABLE_AUTO_REPLY=true
```

### Getting WhatsApp Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app or select existing
3. Add **WhatsApp** product
4. In WhatsApp settings:
   - Copy **Phone Number ID**
   - Generate and copy **Access Token**
   - Choose a **Webhook Verify Token** (any random string)

## Step 2: Start the Bot

```bash
npm start
```

The bot will start on the configured port (default 3000).

## Step 3: Make Your Server Public

### For Development (ngrok)

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### For Production

Deploy your bot to a hosting service (Heroku, VPS, etc.) and use your domain.

## Step 4: Configure Webhook in Meta

1. Go to your WhatsApp app in Meta for Developers
2. Navigate to **WhatsApp > Configuration**
3. Scroll to **Webhook** section
4. Click **Edit** next to Webhook fields

### Webhook URL

```
https://your-domain.com/webhook
```

Replace `your-domain.com` with your ngrok URL or production domain.

### Verify Token

Use the same value you set in `.env` as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

### Webhook Fields

Subscribe to these fields:
- `messages`

### Webhook Events

Subscribe to these message events:
- `message`

## Step 5: Verify Webhook

After saving, Meta will send a GET request to verify the webhook. The bot will automatically handle verification if:

- `hub.mode` = `subscribe`
- `hub.verify_token` matches your `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

If successful, the webhook will show as verified.

## Step 6: Test the Webhook

Send a test message to your WhatsApp Business number. You should see logs in your terminal:

```
Received webhook: { ... }
Processing message from +1234567890: Hello
Successfully processed and synced message from +1234567890
```

## Troubleshooting

### Webhook Verification Fails

- Check that `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches exactly
- Ensure your server is publicly accessible
- Check server logs for errors

### No Messages Received

- Verify webhook is subscribed to `messages` field
- Check that phone number ID is correct
- Ensure access token has proper permissions
- Check server is running and responding

### Timeout Errors

- Increase webhook timeout in Meta settings
- Optimize your message processing speed
- Check server performance

## Security Considerations

- Keep your `WHATSAPP_ACCESS_TOKEN` secret
- Use a strong random `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- Enable rate limiting (already built-in)
- Use HTTPS in production
- Consider adding signature verification for production

## Production Checklist

- [ ] Use a proper domain (not ngrok)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set up monitoring and logging
- [ ] Configure backup storage
- [ ] Test webhook verification
- [ ] Test message receiving
- [ ] Enable auto-reply if needed
- [ ] Configure CRM integration
- [ ] Set up analytics dashboard
