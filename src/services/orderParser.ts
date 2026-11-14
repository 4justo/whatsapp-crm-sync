export interface ProductInfo {
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  sku?: string;
}

export interface ParsedOrder {
  products: ProductInfo[];
  currency?: string;
  discount?: number;
  notes?: string;
  paymentMethod?: string;
  shippingAddress?: string;
}

export class OrderParser {
  private productCatalog: Map<string, { name: string; price: number; sku?: string }>;

  constructor(productCatalog: Array<{ name: string; price: number; sku?: string }> = []) {
    this.productCatalog = new Map();
    for (const product of productCatalog) {
      this.productCatalog.set(product.name.toLowerCase(), product);
    }
  }

  parseFromMessage(message: string): ParsedOrder | null {
    const order: ParsedOrder = { products: [] };

    const quantityPatterns = message.match(/(\d+)\s*(?:x|of|:?|units?)\s*([a-zA-Z0-9\s]+)/gi);
    if (quantityPatterns) {
      for (const pattern of quantityPatterns) {
        const match = pattern.match(/(\d+)\s*(?:x|of|:?|units?)\s*([a-zA-Z0-9\s]+)/i);
        if (match) {
          const quantity = parseInt(match[1], 10);
          const productName = match[2].trim();
          const product = this.lookupProduct(productName);
          order.products.push({
            name: product?.name || productName,
            quantity,
            price: product?.price || 0,
            sku: product?.sku
          });
        }
      }
    }

    const pricePatterns = message.match(/\$?(\d+(?:\.\d{2})?)\s*(?:for|each|per)?\s*([a-zA-Z0-9\s]+)/gi);
    if (pricePatterns) {
      for (const pattern of pricePatterns) {
        const match = pattern.match(/\$?(\d+(?:\.\d{2})?)\s*(?:for|each|per)?\s*([a-zA-Z0-9\s]+)/i);
        if (match) {
          const price = parseFloat(match[1]);
          const productName = match[2].trim();
          const existing = order.products.find(p => p.name.toLowerCase() === productName.toLowerCase());
          if (existing) {
            existing.price = price;
          } else {
            const product = this.lookupProduct(productName);
            order.products.push({
              name: product?.name || productName,
              quantity: 1,
              price,
              sku: product?.sku
            });
          }
        }
      }
    }

    const currencyMatch = message.match(/\b(USD|EUR|GBP|CAD|AUD|JPY|INR)\b/i);
    if (currencyMatch) {
      order.currency = currencyMatch[1].toUpperCase();
    }

    const discountMatch = message.match(/discount\s*(?:of\s*)?\$?(\d+(?:\.\d{2})?)/i);
    if (discountMatch) {
      order.discount = parseFloat(discountMatch[1]);
    }

    const shippingMatch = message.match(/ship\s*(?:to\s*:?)?\s*([^\n]+)/i);
    if (shippingMatch) {
      order.shippingAddress = shippingMatch[1].trim();
    }

    const paymentMatch = message.match(/pay\s*(?:ment\s*)?(?:by\s*|via\s*)?([^\s]+)/i);
    if (paymentMatch) {
      order.paymentMethod = paymentMatch[1].trim();
    }

    if (order.products.length === 0) {
      return null;
    }

    return order;
  }

  private lookupProduct(name: string): { name: string; price: number; sku?: string } | undefined {
    const normalizedName = name.toLowerCase();
    return this.productCatalog.get(normalizedName) ||
           Array.from(this.productCatalog.values()).find(p =>
             p.name.toLowerCase().includes(normalizedName) ||
             normalizedName.includes(p.name.toLowerCase())
           );
  }

  addProduct(product: { name: string; price: number; sku?: string }): void {
    this.productCatalog.set(product.name.toLowerCase(), product);
  }
}
