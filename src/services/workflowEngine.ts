import { WorkflowRule, WorkflowContext } from '../types/workflow.js';
import { ExtractedCustomerInfo } from '../types/index.js';
import { WhatsAppSender } from '../integrations/whatsappSender.js';
import { CRMInterface } from './crmInterface.js';

export class WorkflowEngine {
  private rules: WorkflowRule[] = [];
  private whatsappSender?: WhatsAppSender;
  private crm?: CRMInterface;

  constructor(whatsappSender?: WhatsAppSender, crm?: CRMInterface) {
    this.whatsappSender = whatsappSender;
    this.crm = crm;
  }

  addRule(rule: WorkflowRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  async executeWorkflows(context: WorkflowContext): Promise<void> {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.matchesTrigger(rule, context)) {
        console.log(`Executing workflow: ${rule.name}`);
        await this.executeActions(rule.actions, context);
      }
    }
  }

  private matchesTrigger(rule: WorkflowRule, context: WorkflowContext): boolean {
    const { type, value } = rule.trigger;

    switch (type) {
      case 'intent':
        return context.intent === value;
      case 'sentiment':
        return context.sentiment === value;
      case 'urgency':
        return context.urgency === value;
      case 'keyword':
        return context.message.toLowerCase().includes(value.toLowerCase());
      default:
        return false;
    }
  }

  private async executeActions(actions: WorkflowRule['actions'], context: WorkflowContext): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, context);
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
      }
    }
  }

  private async executeAction(action: WorkflowRule['actions'][0], context: WorkflowContext): Promise<void> {
    switch (action.type) {
      case 'send_message':
        if (this.whatsappSender && action.config.phone) {
          await this.whatsappSender.sendTextMessage(action.config.phone as string, action.config.message as string);
        }
        break;

      case 'assign_lead':
        if (this.crm) {
          await this.crm.logConversation(context.contactId, `Lead assigned to: ${action.config.assignee}`, false);
        }
        break;

      case 'tag_contact':
        if (this.crm) {
          await this.crm.updateContact(context.contactId, { ...action.config as ExtractedCustomerInfo });
        }
        break;

      case 'create_order':
        console.log('Order creation action - would integrate with e-commerce');
        break;

      case 'schedule_appointment':
        console.log('Appointment scheduling action - would integrate with calendar');
        break;
    }
  }
}
