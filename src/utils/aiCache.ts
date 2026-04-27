interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class AICache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private maxSize = 100

  private cleanup(): void {
    // Remove oldest entries until we're below max size
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    while (this.cache.size >= this.maxSize) {
      const [key] = entries.shift()!
      this.cache.delete(key)
    }
  }

  set<T>(key: string, data: T, ttl = 60000): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    } as CacheEntry<T>)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has<T>(key: string): boolean {
    return this.get<T>(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }
}

const cache = new AICache()

export function cacheAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cacheKey: string,
  ttl = 60000,
): T {
  const wrappedFn = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = `${cacheKey}:${JSON.stringify(args)}`

    // Try to get from cache first
    const cached = cache.get<ReturnType<T>>(key)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    try {
      const result = await fn(...args)
      cache.set<ReturnType<T>>(key, result, ttl)
      return result
    } catch (error) { 
      // Don't cache errors
      throw error
    }
  }
  return wrappedFn as T
}

export { cache as aiCache }


