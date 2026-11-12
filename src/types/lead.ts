export interface LeadScore {
  score: number;
  reasons: string[];
  priority: 'hot' | 'warm' | 'cold';
}

export interface LeadCriteria {
  budget?: string;
  timeline?: string;
  companySize?: string;
  decisionMaker?: boolean;
  painPoints?: string[];
}

export interface AssignmentRule {
  criteria: LeadCriteria;
  assignTo: string;
}
