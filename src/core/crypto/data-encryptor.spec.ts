import { randomBytes } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { DataEncryptor } from '@/core/crypto/data-encryptor'

const key = randomBytes(32).toString('hex')

describe('DataEncryptor', () => {
  const encryptor = new DataEncryptor(key)

  it('cifra e decifra de volta ao valor original', () => {
    const plain = 'X$7mQ9!kP2vB#zRt'
    const data = encryptor.encrypt(plain)

    expect(data.encrypted).not.toContain(plain)
    expect(data.iv).toMatch(/^[0-9a-f]{24}$/)
    expect(data.tag).toMatch(/^[0-9a-f]{32}$/)
    expect(encryptor.decrypt(data)).toBe(plain)
  })

  it('usa um IV diferente a cada cifragem', () => {
    const first = encryptor.encrypt('mesma-senha')
    const second = encryptor.encrypt('mesma-senha')

    expect(first.iv).not.toBe(second.iv)
    expect(first.encrypted).not.toBe(second.encrypted)
  })

  it('falha ao decifrar dado adulterado (integridade GCM)', () => {
    const data = encryptor.encrypt('senha-original')
    const tampered = { ...data, tag: data.tag.replace(/^./, (c) => (c === '0' ? '1' : '0')) }

    expect(() => encryptor.decrypt(tampered)).toThrow()
  })

  it('falha ao decifrar com outra chave', () => {
    const data = encryptor.encrypt('senha-original')
    const other = new DataEncryptor(randomBytes(32).toString('hex'))

    expect(() => other.decrypt(data)).toThrow()
  })

  it('rejeita chave com tamanho ou formato inválido', () => {
    expect(() => new DataEncryptor('abc')).toThrow(/ENCRYPTION_KEY/)
    expect(() => new DataEncryptor('z'.repeat(64))).toThrow(/ENCRYPTION_KEY/)
  })
})
