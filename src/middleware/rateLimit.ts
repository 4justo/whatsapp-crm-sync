import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private skipSuccessfulRequests: boolean;
  private requests: Map<string, number[]> = new Map();

  constructor(config: RateLimitConfig = {}) {
    this.windowMs = config.windowMs || 60000;
    this.maxRequests = config.maxRequests || 100;
    this.skipSuccessfulRequests = config.skipSuccessfulRequests || false;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = req.ip || 'unknown';
      const now = Date.now();
      const windowStart = now - this.windowMs;

      const userRequests = this.requests.get(key) || [];
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);

      if (validRequests.length >= this.maxRequests) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }

      validRequests.push(now);
      this.requests.set(key, validRequests);

      if (this.skipSuccessfulRequests) {
        const originalJson = res.json.bind(res);
        res.json = function(data: unknown) {
          if (res.statusCode < 400) {
            const updated = validRequests.filter(t => t !== now);
            instance.requests.set(key, updated);
          }
          return originalJson(data);
        };
      }

      next();
    };
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => t > windowStart);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

const instance = new RateLimiter();
setInterval(() => instance.cleanup(), 60000);

export default instance;
