export class WhatsAppSender {
  private phoneNumberId: string;
  private accessToken: string;

  constructor(phoneNumberId: string, accessToken: string) {
    this.phoneNumberId = phoneNumberId;
    this.accessToken = accessToken;
  }

  async sendTextMessage(to: string, body: string): Promise<string> {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body, preview_url: false }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`WhatsApp send failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages?.[0]?.id;
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    parameters: string[] = []
  ): Promise<string> {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: language },
            components: parameters.length > 0
              ? [{ type: 'body', parameters: parameters.map(p => ({ type: 'text', text: p })) }]
              : []
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`WhatsApp template send failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages?.[0]?.id;
  }
}
