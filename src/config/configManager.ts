import { INDUSTRY_PRESETS, IndustryPreset, SIMPLE_MODE_DEFAULT, SimpleModeConfig } from './presets.js';
import dotenv from 'dotenv';

export class ConfigManager {
  private config: Record<string, string> = {};

  constructor() {
    dotenv.config();
    this.config = process.env as Record<string, string>;
  }

  applyPreset(presetName: string): void {
    const preset = INDUSTRY_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    console.log(`Applying preset: ${preset.name}`);
    console.log(`Description: ${preset.description}`);

    this.setFeatureFlags(preset.features);
    this.suggestIntegrations(preset.suggestedIntegrations);
  }

  enableSimpleMode(config?: Partial<SimpleModeConfig>): void {
    const modeConfig = { ...SIMPLE_MODE_DEFAULT, ...config };

    console.log('Enabling Simple Mode');
    console.log('AI Features:', modeConfig.aiFeatures);
    console.log('Storage:', modeConfig.storage);

    this.config['SIMPLE_MODE'] = 'true';
    this.config['ENABLE_SUMMARIZATION'] = modeConfig.aiFeatures.summarization.toString();
    this.config['ENABLE_STYLE_LEARNING'] = modeConfig.aiFeatures.styleLearning.toString();
    this.config['ENABLE_AUTO_REPLY'] = modeConfig.aiFeatures.autoReply.toString();
    this.config['STORAGE_TYPE'] = modeConfig.storage;
    this.config['ENABLE_ANALYTICS'] = modeConfig.analytics.toString();

    if (modeConfig.storage === 'memory') {
      this.config['STORAGE_PATH'] = '';
      this.config['REDIS_URL'] = '';
    }
  }

  setFeatureFlags(features: IndustryPreset['features']): void {
    this.config['ENABLE_CRM'] = features.crm.toString();
    this.config['ENABLE_ORDERS'] = features.orders.toString();
    this.config['ENABLE_APPOINTMENTS'] = features.appointments.toString();
    this.config['ENABLE_SUMMARIZATION'] = features.summarization.toString();
    this.config['ENABLE_STYLE_LEARNING'] = features.styleLearning.toString();
    this.config['ENABLE_AUTO_REPLY'] = features.autoReply.toString();
    this.config['ENABLE_URGENCY_DETECTION'] = features.urgencyDetection.toString();
  }

  suggestIntegrations(integrations: string[]): void {
    console.log('\nSuggested integrations:');
    for (const integration of integrations) {
      console.log(`  - ${integration}`);
    }
    console.log('\nSet up these environment variables to enable integrations.');
  }

  get(key: string): string | undefined {
    return this.config[key];
  }

  getBoolean(key: string, defaultValue: boolean = false): boolean {
    const value = this.config[key];
    if (!value) return defaultValue;
    return value === 'true' || value === '1';
  }

  getNumber(key: string, defaultValue: number = 0): number {
    const value = this.config[key];
    if (!value) return defaultValue;
    return parseInt(value, 10);
  }

  getArray(key: string): string[] {
    const value = this.config[key];
    if (!value) return [];
    return value.split(',').map(s => s.trim());
  }

  getAllPresets(): string[] {
    return Object.keys(INDUSTRY_PRESETS);
  }

  printPresetInfo(presetName: string): void {
    const preset = INDUSTRY_PRESETS[presetName];
    if (!preset) {
      console.log(`Unknown preset: ${presetName}`);
      return;
    }

    console.log(`\n=== ${preset.name} ===`);
    console.log(`Description: ${preset.description}\n`);
    console.log('Features:');
    console.log(`  CRM: ${preset.features.crm ? '✓' : '✗'}`);
    console.log(`  Orders: ${preset.features.orders ? '✓' : '✗'}`);
    console.log(`  Appointments: ${preset.features.appointments ? '✓' : '✗'}`);
    console.log(`  Summarization: ${preset.features.summarization ? '✓' : '✗'}`);
    console.log(`  Style Learning: ${preset.features.styleLearning ? '✓' : '✗'}`);
    console.log(`  Auto Reply: ${preset.features.autoReply ? '✓' : '✗'}`);
    console.log(`  Urgency Detection: ${preset.features.urgencyDetection ? '✓' : '✗'}`);
    console.log('\nSuggested Integrations:', preset.suggestedIntegrations.join(', '));
  }

  printSetupGuide(): void {
    console.log('\n=== Quick Setup Guide ===\n');
    console.log('1. Choose an industry preset:');
    console.log('   - retail: E-commerce focus');
    console.log('   - services: Appointment booking focus');
    console.log('   - restaurant: Reservation focus');
    console.log('   - support: Customer service focus');
    console.log('   - simple: Basic automation\n');
    console.log('2. Or enable Simple Mode for minimal setup\n');
    console.log('3. Configure required environment variables in .env\n');
    console.log('4. Start the server: npm start\n');
    console.log('For detailed setup, visit: https://github.com/4justo/whatsapp-crm-sync\n');
  }
}
