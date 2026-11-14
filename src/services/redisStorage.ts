import { StorageAdapter } from '../types/storage.js';

export class RedisStorage implements StorageAdapter {
  private client: any;

  constructor(redisUrl: string) {
    try {
      const Redis = require('redis');
      this.client = Redis.createClient({ url: redisUrl });
      this.client.connect();
    } catch (error) {
      console.error('Redis client not available, falling back to memory');
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return await this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.client) return;
    await this.client.set(key, value);
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }
}
