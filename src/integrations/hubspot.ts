import { HubSpotClient } from '@hubspot/api-client';
import { HubSpotContact, HubSpotNote, ExtractedCustomerInfo } from '../types/index.js';

export class HubSpotIntegration {
  private client: HubSpotClient;

  constructor(apiKey: string) {
    this.client = new HubSpotClient({ apiKey });
  }

  async findOrCreateContact(phone: string, info: ExtractedCustomerInfo): Promise<number> {
    try {
      // Search for existing contact by phone
      const searchResponse = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'phone',
                operator: 'EQ',
                value: phone
              }
            ]
          }
        ]
      });

      if (searchResponse.results && searchResponse.results.length > 0) {
        console.log(`Found existing contact: ${searchResponse.results[0].id}`);
        return Number(searchResponse.results[0].id);
      }

      // Create new contact
      const contact: HubSpotContact = {
        email: info.email,
        firstname: info.name?.split(' ')[0],
        lastname: info.name?.split(' ').slice(1).join(' '),
        phone: phone,
        company: info.company,
        properties: {
          ...info,
          whatsapp_phone: phone
        }
      };

      const createResponse = await this.client.crm.contacts.basicApi.create(contact);
      console.log(`Created new contact: ${createResponse.id}`);
      return Number(createResponse.id);
    } catch (error) {
      console.error('HubSpot contact error:', error);
      throw error;
    }
  }

  async logConversation(contactId: number, message: string, fromCustomer: boolean): Promise<void> {
    try {
      const note: HubSpotNote = {
        engagement: {
          type: 'NOTE'
        },
        metadata: {
          body: `[WhatsApp - ${fromCustomer ? 'Customer' : 'Business'}]: ${message}`
        },
        associations: {
          contactIds: [contactId]
        }
      };

      await this.client.crm.engagements.notesApi.create(note);
      console.log(`Logged note for contact ${contactId}`);
    } catch (error) {
      console.error('HubSpot note error:', error);
    }
  }

  async updateContact(contactId: number, info: ExtractedCustomerInfo): Promise<void> {
    try {
      const contact: HubSpotContact = {
        properties: {
          ...info
        }
      };

      await this.client.crm.contacts.basicApi.update(contactId, contact);
      console.log(`Updated contact ${contactId}`);
    } catch (error) {
      console.error('HubSpot update error:', error);
    }
  }
}
