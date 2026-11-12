import { ExtractedCustomerInfo } from '../types/index.js';
import { LeadScore, LeadCriteria, AssignmentRule } from '../types/lead.js';

export class LeadScorer {
  private assignmentRules: AssignmentRule[] = [];

  addAssignmentRule(rule: AssignmentRule): void {
    this.assignmentRules.push(rule);
  }

  scoreLead(info: ExtractedCustomerInfo): LeadScore {
    let score = 0;
    const reasons: string[] = [];

    if (info.budget) {
      score += 30;
      reasons.push('Budget mentioned');
    }

    if (info.timeline) {
      score += 25;
      reasons.push('Timeline provided');
    }

    if (info.company) {
      score += 20;
      reasons.push('Company identified');
    }

    if (info.painPoints && info.painPoints.length > 0) {
      score += 15;
      reasons.push('Pain points identified');
    }

    if (info.intent?.includes('sales') || info.intent?.includes('purchase')) {
      score += 20;
      reasons.push('Purchase intent');
    }

    let priority: 'hot' | 'warm' | 'cold' = 'cold';
    if (score >= 70) priority = 'hot';
    else if (score >= 40) priority = 'warm';

    return { score, reasons, priority };
  }

  assignLead(info: ExtractedCustomerInfo): string | null {
    const criteria: LeadCriteria = {
      budget: info.budget,
      timeline: info.timeline,
      companySize: info.company,
      painPoints: info.painPoints
    };

    for (const rule of this.assignmentRules) {
      if (this.matchesCriteria(criteria, rule.criteria)) {
        return rule.assignTo;
      }
    }

    return null;
  }

  private matchesCriteria(input: LeadCriteria, rule: LeadCriteria): boolean {
    if (rule.budget && input.budget !== rule.budget) return false;
    if (rule.timeline && input.timeline !== rule.timeline) return false;
    if (rule.companySize && input.companySize !== rule.companySize) return false;
    return true;
  }
}
