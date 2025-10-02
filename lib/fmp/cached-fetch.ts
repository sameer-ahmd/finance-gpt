import Redis from 'ioredis';

// Initialize Redis client
let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('REDIS_URL not set, caching disabled');
    return null;
  }

  try {
    redis = new Redis(redisUrl);
    return redis;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

// Retry logic with exponential backoff and jitter
async function fetchWithRetry(
  url: string,
  maxRetries = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      // Handle rate limiting and server errors
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) break;

      // Exponential backoff with jitter: 2^attempt * 100ms + random(0-100ms)
      const baseDelay = Math.pow(2, attempt) * 100;
      const jitter = Math.random() * 100;
      const delay = baseDelay + jitter;

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

// Generate stable cache key from path and params
function generateCacheKey(path: string, params: Record<string, string | number>): string {
  // Sort params for consistent cache keys
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  return `fmp:v1:${path}?${sortedParams}`;
}

export interface CachedFetchOptions {
  path: string;
  params?: Record<string, string | number>;
  ttl?: number; // TTL in seconds, default 24 hours
}

export async function cachedFetch<T = any>(
  options: CachedFetchOptions
): Promise<T> {
  const { path, params = {}, ttl = 86400 } = options; // 24 hours default

  // Validate API key
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error('FMP_API_KEY environment variable is not set');
  }

  // Add API key to params
  const allParams: Record<string, string | number> = { ...params, apikey: apiKey };

  // Generate cache key
  const cacheKey = generateCacheKey(path, params); // Don't include apikey in cache key

  // Try to get from cache
  const redisClient = getRedisClient();
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (error) {
      console.warn('Redis get failed:', error);
    }
  }

  // Build URL
  const queryString = Object.keys(allParams)
    .map(key => `${key}=${encodeURIComponent(String(allParams[key]))}`)
    .join('&');
  const url = `https://financialmodelingprep.com/api/v3/${path}?${queryString}`;

  // Fetch with retry
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(
      `FMP API error: ${response.status} ${response.statusText} for ${path}`
    );
  }

  const data = await response.json();

  // Cache the result
  if (redisClient) {
    try {
      await redisClient.setex(cacheKey, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Redis set failed:', error);
    }
  }

  return data as T;
}
