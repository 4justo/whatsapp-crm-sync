import { OrderInfo, ShopifyOrder } from '../types/order.js';

export class ShopifyIntegration {
  private storeUrl: string;
  private accessToken: string;

  constructor(storeUrl: string, accessToken: string) {
    this.storeUrl = storeUrl.replace(/\/$/, '');
    this.accessToken = accessToken;
  }

  async createOrder(orderInfo: OrderInfo): Promise<number> {
    const shopifyOrder: ShopifyOrder = {
      line_items: orderInfo.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price ? p.price.toString() : undefined
      })),
      customer: {
        first_name: orderInfo.customer.name.split(' ')[0],
        last_name: orderInfo.customer.name.split(' ').slice(1).join(' '),
        email: orderInfo.customer.email,
        phone: orderInfo.customer.phone
      },
      note: orderInfo.notes,
      tags: 'whatsapp-order'
    };

    if (orderInfo.customer.address) {
      shopifyOrder.shipping_address = {
        address1: orderInfo.customer.address,
        city: '',
        country: ''
      };
    }

    const response = await fetch(`${this.storeUrl}/admin/api/2024-01/orders.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order: shopifyOrder })
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.order.id;
  }
}
