import { ExtractedCustomerInfo } from '../types/index.js';
import { CRMInterface } from '../services/crmInterface.js';

export class NotionIntegration implements CRMInterface {
  private accessToken: string;
  private databaseId: string;

  constructor(accessToken: string, databaseId: string) {
    this.accessToken = accessToken;
    this.databaseId = databaseId;
  }

  async findOrCreateContact(phone: string, info: ExtractedCustomerInfo): Promise<string | number> {
    const searchResponse = await fetch(
      `https://api.notion.com/v1/databases/${this.databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            property: 'Phone',
            phone: { equals: phone }
          }
        })
      }
    );

    const searchData = await searchResponse.json();

    if (searchData.results && searchData.results.length > 0) {
      console.log(`Found existing Notion page: ${searchData.results[0].id}`);
      return searchData.results[0].id;
    }

    const pageData = {
      parent: { database_id: this.databaseId },
      properties: {
        Name: {
          title: [{ text: { content: info.name || 'Unknown' } }]
        },
        Phone: {
          phone: phone
        },
        Email: info.email ? { email: info.email } : undefined,
        Company: info.company ? { rich_text: [{ text: { content: info.company } }] } : undefined
      }
    };

    const createResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pageData)
    });

    if (!createResponse.ok) {
      throw new Error(`Notion API error: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    console.log(`Created Notion page: ${createData.id}`);
    return createData.id;
  }

  async logConversation(contactId: string | number, message: string, fromCustomer: boolean): Promise<void> {
    await this.logConversationToPage(contactId as string, message, fromCustomer);
  }

  async updateContact(contactId: string | number, info: ExtractedCustomerInfo): Promise<void> {
    await this.updatePage(contactId as string, info);
  }

  async logConversationToPage(pageId: string, message: string, fromCustomer: boolean): Promise<void> {
    const blockData = {
      parent: { page_id: pageId },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: `[WhatsApp - ${fromCustomer ? 'Customer' : 'Business'}]: ${message}` }
              }
            ]
          }
        }
      ]
    };

    const response = await fetch(`https://api.notion.com/v1/blocks/children`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(blockData)
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    console.log(`Logged conversation to Notion page ${pageId}`);
  }

  async updatePage(pageId: string, info: ExtractedCustomerInfo): Promise<void> {
    const updateData: Record<string, unknown> = {
      properties: {}
    };

    if (info.email) {
      updateData.properties.Email = { email: info.email };
    }
    if (info.company) {
      updateData.properties.Company = { rich_text: [{ text: { content: info.company } }] };
    }

    if (Object.keys(updateData.properties).length === 0) return;

    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    console.log(`Updated Notion page ${pageId}`);
  }
}
