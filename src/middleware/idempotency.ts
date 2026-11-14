import { Request, Response, NextFunction } from 'express';
import { StorageAdapter } from '../types/storage.js';

export class IdempotencyMiddleware {
  private storage: StorageAdapter;
  private headerName: string;

  constructor(storage: StorageAdapter, headerName: string = 'Idempotency-Key') {
    this.storage = storage;
    this.headerName = headerName;
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const idempotencyKey = req.headers[this.headerName.toLowerCase()] as string;

      if (!idempotencyKey) {
        next();
        return;
      }

      const cacheKey = `idempotency:${idempotencyKey}`;
      const cached = await this.storage.get(cacheKey);

      if (cached) {
        const cachedResponse = JSON.parse(cached);
        res.status(cachedResponse.status).json(cachedResponse.body);
        return;
      }

      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);

      let statusCode = 200;
      let responseBody: unknown;

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      res.json = function(body: unknown) {
        responseBody = body;
        return originalJson(body);
      };

      res.on('finish', async () => {
        if (statusCode >= 200 && statusCode < 300) {
          await this.storage.set(cacheKey, JSON.stringify({
            status: statusCode,
            body: responseBody
          }));
        }
      });

      next();
    };
  }
}
