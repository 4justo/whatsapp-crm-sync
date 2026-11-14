export class RetryError extends Error {
  constructor(message: string, public readonly lastError: Error) {
    super(message);
    this.name = 'RetryError';
  }
}

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', '5']
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const isRetryable = retryableErrors.some(pattern =>
        lastError?.message.includes(pattern) ||
        lastError?.name.includes(pattern)
      );

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }

      console.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw new RetryError(`All ${maxAttempts} attempts failed`, lastError!);
}
