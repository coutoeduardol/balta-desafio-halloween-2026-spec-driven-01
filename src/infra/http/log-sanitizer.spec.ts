import { describe, expect, it } from 'vitest'

import { LOG_MASK, sanitize } from '@/infra/http/log-sanitizer'

describe('sanitize', () => {
  it('mascara propriedades sensíveis em qualquer nível', () => {
    const input = {
      guid: 'abc',
      password: 'segredo',
      nested: { Password: 'x', items: [{ encrypted: 'e', iv: 'i', tag: 't', ok: 1 }] },
    }

    expect(sanitize(input)).toEqual({
      guid: 'abc',
      password: LOG_MASK,
      nested: { Password: LOG_MASK, items: [{ encrypted: LOG_MASK, iv: LOG_MASK, tag: LOG_MASK, ok: 1 }] },
    })
  })

  it('mantém valores primitivos e nulos', () => {
    expect(sanitize('texto')).toBe('texto')
    expect(sanitize(null)).toBeNull()
    expect(sanitize(42)).toBe(42)
  })

  it('não altera o objeto original', () => {
    const input = { password: 'segredo' }
    sanitize(input)
    expect(input.password).toBe('segredo')
  })
})
