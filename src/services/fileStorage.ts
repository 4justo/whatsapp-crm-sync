import { StorageAdapter } from '../types/storage.js';
import { promises as fs } from 'fs';
import path from 'path';

export class FileStorage implements StorageAdapter {
  private basePath: string;

  constructor(basePath: string = './data') {
    this.basePath = basePath;
  }

  private getPath(key: string): string {
    return path.join(this.basePath, `${key}.json`);
  }

  async get(key: string): Promise<string | null> {
    try {
      const filePath = this.getPath(key);
      const data = await fs.readFile(filePath, 'utf-8');
      return data;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    const filePath = this.getPath(key);
    await fs.mkdir(this.basePath, { recursive: true });
    await fs.writeFile(filePath, value, 'utf-8');
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getPath(key);
      await fs.unlink(filePath);
    } catch {
      return;
    }
  }
}
