import { describe, expect, it } from 'vitest'

import { loadEnv } from '@/infra/config/env'

const validKey = 'a'.repeat(64)

describe('loadEnv', () => {
  it('carrega variáveis válidas aplicando padrões', () => {
    const env = loadEnv({ DATABASE_URL: 'file:./dev.db', ENCRYPTION_KEY: validKey })

    expect(env).toEqual({
      NODE_ENV: 'development',
      PORT: 3333,
      DATABASE_URL: 'file:./dev.db',
      ENCRYPTION_KEY: validKey,
    })
  })

  it('rejeita ENCRYPTION_KEY ausente ou inválida', () => {
    expect(() => loadEnv({ DATABASE_URL: 'file:./dev.db' })).toThrow(/ENCRYPTION_KEY/)
    expect(() => loadEnv({ DATABASE_URL: 'file:./dev.db', ENCRYPTION_KEY: 'curta' })).toThrow(
      /ENCRYPTION_KEY/,
    )
  })
})
