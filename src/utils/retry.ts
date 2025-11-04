/**
 * Retry-Utility mit Exponential Backoff
 * 
 * Verwendet für:
 * - OpenAI API Calls (Whisper Transkription)
 * - Telegram API Calls
 * - Andere externe API-Calls
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 Sekunde
  maxDelay: 30000, // 30 Sekunden
  backoffMultiplier: 2,
  retryableErrors: [
    "timeout",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "429", // Rate Limit
    "503", // Service Unavailable
    "502", // Bad Gateway
  ],
};

/**
 * Prüft ob ein Fehler retryable ist
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = errorMessage.toLowerCase();
  
  return retryableErrors.some((retryable) =>
    errorString.includes(retryable.toLowerCase())
  );
}

/**
 * Berechnet Delay für nächsten Retry (Exponential Backoff)
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Wartet für die angegebene Zeit
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Führt eine Funktion mit Retry-Logik aus
 * 
 * @param fn - Funktion die ausgeführt werden soll
 * @param options - Retry-Optionen
 * @returns Ergebnis der Funktion
 * @throws Letzter Fehler nach allen Retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Prüfe ob Fehler retryable ist
      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error; // Nicht retryable, sofort werfen
      }

      // Wenn letzter Versuch, Fehler werfen
      if (attempt === opts.maxRetries) {
        break;
      }

      // Berechne Delay
      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Warte vor nächstem Retry
      await sleep(delay);
    }
  }

  // Alle Retries fehlgeschlagen
  throw lastError;
}

/**
 * Retry mit Logging
 */
export async function withRetryAndLog<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { logger?: { warn: (msg: string, meta?: any) => void } } = {}
): Promise<T> {
  const { logger, ...retryOptions } = options;
  const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error;
      }

      if (attempt === opts.maxRetries) {
        break;
      }

      const delay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      logger?.warn(
        `Retry ${attempt + 1}/${opts.maxRetries} nach ${delay}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
          attempt: attempt + 1,
          delay,
        }
      );

      await sleep(delay);
    }
  }

  throw lastError;
}


