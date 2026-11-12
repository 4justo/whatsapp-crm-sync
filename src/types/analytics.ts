export interface MessageStats {
  totalMessages: number;
  byIntent: Record<string, number>;
  byHour: Record<number, number>;
  byDay: Record<string, number>;
}

export interface LeadStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  avgScore: number;
}

export interface OrderStats {
  totalOrders: number;
  totalValue: number;
  byProduct: Record<string, number>;
}

export interface AppointmentStats {
  totalAppointments: number;
  scheduledToday: number;
  scheduledThisWeek: number;
}

export interface AnalyticsData {
  messages: MessageStats;
  leads: LeadStats;
  orders: OrderStats;
  appointments: AppointmentStats;
}
