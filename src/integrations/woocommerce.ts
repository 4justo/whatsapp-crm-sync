import { OrderInfo } from '../types/order.js';

export class WooCommerceIntegration {
  private storeUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string) {
    this.storeUrl = storeUrl.replace(/\/$/, '');
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  private getAuthHeader() {
    const timestamp = Math.floor(Date.now() / 1000);
    return {
      'Authorization': `Basic ${Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')}`
    };
  }

  async createOrder(orderInfo: OrderInfo): Promise<number> {
    const payload = {
      billing: {
        first_name: orderInfo.customer.name.split(' ')[0],
        last_name: orderInfo.customer.name.split(' ').slice(1).join(' '),
        email: orderInfo.customer.email,
        phone: orderInfo.customer.phone
      },
      line_items: orderInfo.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price
      })),
      note: orderInfo.notes,
      status: 'pending'
    };

    const response = await fetch(
      `${this.storeUrl}/wp-json/wc/v3/orders`,
      {
        method: 'POST',
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }
}
