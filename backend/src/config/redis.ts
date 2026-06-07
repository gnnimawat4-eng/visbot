import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

redis.on('error', (err) => console.error('[Redis]', err.message))
redis.on('connect', () => console.log('[Redis] Connected'))
