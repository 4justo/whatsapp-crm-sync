import { ExtractedCustomerInfo } from '../types/index.js';
import { CRMInterface } from '../services/crmInterface.js';

export class SalesforceIntegration implements CRMInterface {
  private instanceUrl: string;
  private accessToken: string;

  constructor(instanceUrl: string, accessToken: string) {
    this.instanceUrl = instanceUrl.replace(/\/$/, '');
    this.accessToken = accessToken;
  }

  async findOrCreateContact(phone: string, info: ExtractedCustomerInfo): Promise<string | number> {
    const query = `SELECT Id, FirstName, LastName, Email, Phone FROM Contact WHERE Phone = '${phone}' LIMIT 1`;

    const searchResponse = await fetch(`${this.instanceUrl}/services/data/v60.0/query?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const searchData = await searchResponse.json();

    if (searchData.records && searchData.records.length > 0) {
      console.log(`Found existing Salesforce contact: ${searchData.records[0].Id}`);
      return searchData.records[0].Id;
    }

    const contactData = {
      FirstName: info.name?.split(' ')[0] || '',
      LastName: info.name?.split(' ').slice(1).join(' ') || '',
      Email: info.email || '',
      Phone: phone
    };

    const createResponse = await fetch(`${this.instanceUrl}/services/data/v60.0/sobjects/Contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (!createResponse.ok) {
      throw new Error(`Salesforce API error: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    console.log(`Created Salesforce contact: ${createData.id}`);
    return createData.id;
  }

  async logConversation(contactId: string | number, message: string, fromCustomer: boolean): Promise<void> {
    const activityData = {
      Subject: `WhatsApp Message - ${fromCustomer ? 'Customer' : 'Business'}`,
      Description: message,
      WhoId: contactId
    };

    const response = await fetch(`${this.instanceUrl}/services/data/v60.0/sobjects/Task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityData)
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }

    console.log(`Logged activity for Salesforce contact ${contactId}`);
  }

  async updateContact(contactId: string | number, info: ExtractedCustomerInfo): Promise<void> {
    const updateData: Record<string, string> = {};
    if (info.email) updateData.Email = info.email;
    if (info.company) updateData.Company = info.company;

    if (Object.keys(updateData).length === 0) return;

    const response = await fetch(`${this.instanceUrl}/services/data/v60.0/sobjects/Contact/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }

    console.log(`Updated Salesforce contact ${contactId}`);
  }
}
    const activityData = {
      Subject: 'WhatsApp Message',
      Description: message,
      WhoId: contactId
    };

    const response = await fetch(`${this.instanceUrl}/services/data/v60.0/sobjects/Task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(activityData)
    });

    if (!response.ok) {
      throw new Error(`Salesforce API error: ${response.statusText}`);
    }

    console.log(`Logged activity for Salesforce contact ${contactId}`);
  }
}
