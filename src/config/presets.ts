export interface IndustryPreset {
  name: string;
  description: string;
  features: {
    crm: boolean;
    orders: boolean;
    appointments: boolean;
    summarization: boolean;
    styleLearning: boolean;
    autoReply: boolean;
    urgencyDetection: boolean;
  };
  defaultWorkflow: {
    triggers: string[];
    actions: string[];
  };
  suggestedIntegrations: string[];
}

export const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  retail: {
    name: 'Retail / E-commerce',
    description: 'Focus on order processing and customer follow-up',
    features: {
      crm: true,
      orders: true,
      appointments: false,
      summarization: true,
      styleLearning: true,
      autoReply: true,
      urgencyDetection: true
    },
    defaultWorkflow: {
      triggers: ['order_intent', 'urgent_question'],
      actions: ['create_order', 'send_confirmation', 'update_crm']
    },
    suggestedIntegrations: ['shopify', 'woocommerce', 'hubspot', 'salesforce']
  },
  services: {
    name: 'Services / Consulting',
    description: 'Focus on appointment booking and lead qualification',
    features: {
      crm: true,
      orders: false,
      appointments: true,
      summarization: true,
      styleLearning: true,
      autoReply: true,
      urgencyDetection: true
    },
    defaultWorkflow: {
      triggers: ['booking_intent', 'lead_inquiry'],
      actions: ['schedule_appointment', 'assign_lead', 'send_summary']
    },
    suggestedIntegrations: ['google_calendar', 'hubspot', 'salesforce', 'pipedrive']
  },
  restaurant: {
    name: 'Restaurant / Food Service',
    description: 'Focus on reservations and quick responses',
    features: {
      crm: false,
      orders: false,
      appointments: true,
      summarization: false,
      styleLearning: true,
      autoReply: true,
      urgencyDetection: true
    },
    defaultWorkflow: {
      triggers: ['reservation_request', 'inquiry'],
      actions: ['confirm_reservation', 'send_location']
    },
    suggestedIntegrations: ['google_calendar']
  },
  support: {
    name: 'Customer Support',
    description: 'Focus on ticket resolution and customer satisfaction',
    features: {
      crm: true,
      orders: false,
      appointments: false,
      summarization: true,
      styleLearning: true,
      autoReply: true,
      urgencyDetection: true
    },
    defaultWorkflow: {
      triggers: ['complaint', 'question', 'issue'],
      actions: ['route_to_agent', 'tag_ticket', 'escalate_urgent']
    },
    suggestedIntegrations: ['hubspot', 'salesforce', 'zendesk', 'notion']
  },
  simple: {
    name: 'Simple / General',
    description: 'Basic automation without complex integrations',
    features: {
      crm: false,
      orders: false,
      appointments: false,
      summarization: true,
      styleLearning: true,
      autoReply: true,
      urgencyDetection: false
    },
    defaultWorkflow: {
      triggers: ['any_message'],
      actions: ['summarize_conversation']
    },
    suggestedIntegrations: []
  }
};

export interface SimpleModeConfig {
  enabled: boolean;
  aiFeatures: {
    summarization: boolean;
    styleLearning: boolean;
    autoReply: boolean;
  };
  storage: 'file' | 'memory';
  analytics: boolean;
}

export const SIMPLE_MODE_DEFAULT: SimpleModeConfig = {
  enabled: false,
  aiFeatures: {
    summarization: true,
    styleLearning: false,
    autoReply: false
  },
  storage: 'file',
  analytics: false
};
