import type { FastifyInstance } from 'fastify'

export const LOG_MASK = '[REDACTED]'

const SENSITIVE_KEYS = new Set(['password', 'encrypted', 'iv', 'tag', 'encryption_key'])

// Defesa em profundidade: o pino mascara essas chaves mesmo se alguém logar o objeto cru.
export const logRedactPaths = [
  'password',
  '*.password',
  'body.password',
  'req.body.password',
  'res.body.password',
]

export function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize)
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SENSITIVE_KEYS.has(key.toLowerCase()) ? LOG_MASK : sanitize(entry),
      ]),
    )
  }

  return value
}

export function registerLogSanitizer(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    if (request.body !== undefined) {
      request.log.info({ payload: sanitize(request.body) }, 'request payload')
    }
  })

  app.addHook('preSerialization', async (request, _reply, payload) => {
    request.log.info({ payload: sanitize(payload) }, 'response payload')
    return payload
  })
}
