import { AnalyticsService } from './analytics.js';

export interface DashboardMetrics {
  overview: {
    totalMessages: number;
    totalLeads: number;
    totalOrders: number;
    totalAppointments: number;
    activeConversations: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  urgency: {
    urgent: number;
    normal: number;
  };
  intents: Record<string, number>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: Date;
  }>;
}

export class DashboardService {
  private analytics: AnalyticsService;
  private activityLog: Array<{ type: string; description: string; timestamp: Date }> = [];

  constructor(analytics: AnalyticsService) {
    this.analytics = analytics;
  }

  getMetrics(): DashboardMetrics {
    const metrics = this.analytics.getMetrics();

    return {
      overview: {
        totalMessages: metrics.messages.total,
        totalLeads: metrics.leads.total,
        totalOrders: metrics.orders.total,
        totalAppointments: metrics.appointments.total,
        activeConversations: metrics.messages.today
      },
      sentiment: {
        positive: metrics.sentiment.positive,
        neutral: metrics.sentiment.neutral,
        negative: metrics.sentiment.negative
      },
      urgency: {
        urgent: metrics.urgency.urgent,
        normal: metrics.urgency.normal
      },
      intents: metrics.intents,
      recentActivity: this.activityLog.slice(-20)
    };
  }

  logActivity(type: string, description: string): void {
    this.activityLog.push({
      type,
      description,
      timestamp: new Date()
    });

    if (this.activityLog.length > 100) {
      this.activityLog = this.activityLog.slice(-100);
    }
  }

  getTopIntents(limit: number = 5): Array<{ intent: string; count: number }> {
    const metrics = this.analytics.getMetrics();
    return Object.entries(metrics.intents)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getSentimentTrend(): { positive: number; negative: number; trend: 'improving' | 'declining' | 'stable' } {
    const metrics = this.analytics.getMetrics();
    const total = metrics.sentiment.positive + metrics.sentiment.negative;
    const positiveRatio = total > 0 ? metrics.sentiment.positive / total : 0.5;

    const recent = this.activityLog.slice(-10);
    const recentPositive = recent.filter(a => a.description.includes('positive')).length;
    const recentNegative = recent.filter(a => a.description.includes('negative')).length;
    const recentRatio = recent.length > 0 ? recentPositive / recent.length : positiveRatio;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (recentRatio > positiveRatio + 0.1) trend = 'improving';
    if (recentRatio < positiveRatio - 0.1) trend = 'declining';

    return {
      positive: metrics.sentiment.positive,
      negative: metrics.sentiment.negative,
      trend
    };
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const metrics = this.getMetrics();

    if (format === 'json') {
      return JSON.stringify(metrics, null, 2);
    }

    if (format === 'csv') {
      const lines = [
        'Metric,Value',
        `Total Messages,${metrics.overview.totalMessages}`,
        `Total Leads,${metrics.overview.totalLeads}`,
        `Total Orders,${metrics.overview.totalOrders}`,
        `Total Appointments,${metrics.overview.totalAppointments}`,
        `Positive Sentiment,${metrics.sentiment.positive}`,
        `Neutral Sentiment,${metrics.sentiment.neutral}`,
        `Negative Sentiment,${metrics.sentiment.negative}`,
        `Urgent Messages,${metrics.urgency.urgent}`,
        `Normal Messages,${metrics.urgency.normal}`
      ];

      lines.push('');
      lines.push('Intent,Count');
      for (const [intent, count] of Object.entries(metrics.intents)) {
        lines.push(`${intent},${count}`);
      }

      return lines.join('\n');
    }

    return '';
  }
}
