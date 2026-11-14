export interface WorkflowRule {
  id: string;
  name: string;
  trigger: {
    type: 'intent' | 'sentiment' | 'urgency' | 'keyword';
    value: string;
  };
  actions: Array<{
    type: 'send_message' | 'assign_lead' | 'create_order' | 'schedule_appointment' | 'tag_contact';
    config: Record<string, unknown>;
  }>;
  enabled: boolean;
}

export interface WorkflowContext {
  message: string;
  intent: string;
  sentiment: string;
  urgency: string;
  customerInfo: Record<string, unknown>;
  contactId: number;
}
