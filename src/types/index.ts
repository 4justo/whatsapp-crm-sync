export interface WhatsAppMessage {
  from: string;
  to: string;
  type: string;
  text?: { body: string };
  timestamp: string;
  id: string;
}

export interface WhatsAppWebhookPayload {
  entry: Array<{
    changes: Array<{
      field: string;
      value: {
        metadata?: { phone_number_id: string };
        contacts?: Array<{ profile?: { name: string }; wa_id: string }>;
        messages?: WhatsAppMessage[];
      };
    }>;
  }>;
}

export interface ExtractedCustomerInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  intent?: string;
  painPoints?: string[];
  budget?: string;
  timeline?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency?: 'low' | 'medium' | 'high';
}

export interface HubSpotContact {
  email?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  company?: string;
  properties?: Record<string, string>;
}

export interface HubSpotNote {
  engagement: {
    type: "NOTE";
  };
  metadata: {
    body: string;
  };
  associations: {
    contactIds: number[];
  };
}

export type CRMType = 'hubspot' | 'salesforce';
