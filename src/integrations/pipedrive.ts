import { ExtractedCustomerInfo } from '../types/index.js';
import { CRMInterface } from '../services/crmInterface.js';

export class PipedriveIntegration implements CRMInterface {
  private apiToken: string;
  private companyDomain: string;

  constructor(apiToken: string, companyDomain: string) {
    this.apiToken = apiToken;
    this.companyDomain = companyDomain.replace(/\/$/, '');
  }

  async findOrCreateContact(phone: string, info: ExtractedCustomerInfo): Promise<string | number> {
    const searchResponse = await fetch(
      `${this.companyDomain}/api/v1/persons/search?term=${encodeURIComponent(phone)}&fields=phone`,
      {
        headers: { 'Authorization': `Bearer ${this.apiToken}` }
      }
    );

    const searchData = await searchResponse.json();

    if (searchData.data && searchData.data.length > 0) {
      console.log(`Found existing Pipedrive person: ${searchData.data[0].id}`);
      return searchData.data[0].id;
    }

    const personData = {
      name: info.name || 'Unknown',
      email: info.email || [],
      phone: [{ value: phone, label: 'Mobile' }]
    };

    const createResponse = await fetch(
      `${this.companyDomain}/api/v1/persons`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personData)
      }
    );

    if (!createResponse.ok) {
      throw new Error(`Pipedrive API error: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    console.log(`Created Pipedrive person: ${createData.data.id}`);
    return createData.data.id;
  }

  async logConversation(contactId: string | number, message: string, fromCustomer: boolean): Promise<void> {
    const activityData = {
      subject: `WhatsApp Message - ${fromCustomer ? 'Customer' : 'Business'}`,
      note: message,
      person_id: contactId as number,
      type: 'note'
    };

    const response = await fetch(
      `${this.companyDomain}/api/v1/activities`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(activityData)
      }
    );

    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.statusText}`);
    }

    console.log(`Logged activity for Pipedrive person ${contactId}`);
  }

  async updateContact(contactId: string | number, info: ExtractedCustomerInfo): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (info.email) updateData.email = info.email;
    if (info.company) updateData.org_id = await this.findOrCreateCompany(info.company);

    if (Object.keys(updateData).length === 0) return;

    const response = await fetch(
      `${this.companyDomain}/api/v1/persons/${contactId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.statusText}`);
    }

    console.log(`Updated Pipedrive person ${contactId}`);
  }

  private async findOrCreateCompany(name: string): Promise<number> {
    const searchResponse = await fetch(
      `${this.companyDomain}/api/v1/organizations/search?term=${encodeURIComponent(name)}`,
      {
        headers: { 'Authorization': `Bearer ${this.apiToken}` }
      }
    );

    const searchData = await searchResponse.json();

    if (searchData.data && searchData.data.length > 0) {
      return searchData.data[0].id;
    }

    const createResponse = await fetch(
      `${this.companyDomain}/api/v1/organizations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      }
    );

    const createData = await createResponse.json();
    return createData.data.id;
  }
}
