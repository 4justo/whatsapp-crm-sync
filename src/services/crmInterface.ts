import { ExtractedCustomerInfo } from '../types/index.js';

export interface CRMInterface {
  findOrCreateContact(phone: string, info: ExtractedCustomerInfo): Promise<string | number>;
  logConversation(contactId: string | number, message: string, fromCustomer: boolean): Promise<void>;
  updateContact(contactId: string | number, info: ExtractedCustomerInfo): Promise<void>;
}
