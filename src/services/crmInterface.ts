import { ExtractedCustomerInfo } from '../types/index.js';

export interface CRMInterface {
  findOrCreateContact(phone: string, info: ExtractedCustomerInfo): Promise<number>;
  logConversation(contactId: number, message: string, fromCustomer: boolean): Promise<void>;
  updateContact(contactId: number, info: ExtractedCustomerInfo): Promise<void>;
}
