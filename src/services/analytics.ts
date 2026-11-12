import { AnalyticsData, MessageStats, LeadStats, OrderStats, AppointmentStats } from '../types/analytics.js';

export class AnalyticsService {
  private messageHistory: Array<{ timestamp: Date; intent: string }> = [];
  private leadScores: number[] = [];
  private orders: Array<{ value: number; product: string }> = [];
  private appointments: Array<{ date: Date }> = [];

  recordMessage(intent: string): void {
    this.messageHistory.push({ timestamp: new Date(), intent });
  }

  recordLead(score: number): void {
    this.leadScores.push(score);
  }

  recordOrder(value: number, product: string): void {
    this.orders.push({ value, product });
  }

  recordAppointment(date: Date): void {
    this.appointments.push({ date });
  }

  getMessageStats(): MessageStats {
    const byIntent: Record<string, number> = {};
    const byHour: Record<number, number> = {};
    const byDay: Record<string, number> = {};

    for (const msg of this.messageHistory) {
      byIntent[msg.intent] = (byIntent[msg.intent] || 0) + 1;
      const hour = msg.timestamp.getHours();
      byHour[hour] = (byHour[hour] || 0) + 1;
      const day = msg.timestamp.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    }

    return {
      totalMessages: this.messageHistory.length,
      byIntent,
      byHour,
      byDay
    };
  }

  getLeadStats(): LeadStats {
    const hot = this.leadScores.filter(s => s >= 70).length;
    const warm = this.leadScores.filter(s => s >= 40 && s < 70).length;
    const cold = this.leadScores.filter(s => s < 40).length;
    const avgScore = this.leadScores.length > 0
      ? this.leadScores.reduce((a, b) => a + b, 0) / this.leadScores.length
      : 0;

    return {
      totalLeads: this.leadScores.length,
      hotLeads: hot,
      warmLeads: warm,
      coldLeads: cold,
      avgScore
    };
  }

  getOrderStats(): OrderStats {
    const byProduct: Record<string, number> = {};
    let totalValue = 0;

    for (const order of this.orders) {
      byProduct[order.product] = (byProduct[order.product] || 0) + 1;
      totalValue += order.value;
    }

    return {
      totalOrders: this.orders.length,
      totalValue,
      byProduct
    };
  }

  getAppointmentStats(): AppointmentStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const scheduledToday = this.appointments.filter(a => a.date >= today && a.date < new Date(today.getTime() + 86400000)).length;
    const scheduledThisWeek = this.appointments.filter(a => a.date >= today && a.date < weekEnd).length;

    return {
      totalAppointments: this.appointments.length,
      scheduledToday,
      scheduledThisWeek
    };
  }

  getAnalytics(): AnalyticsData {
    return {
      messages: this.getMessageStats(),
      leads: this.getLeadStats(),
      orders: this.getOrderStats(),
      appointments: this.getAppointmentStats()
    };
  }
}
