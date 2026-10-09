import { describe, expect, it } from 'vitest'

import { CHARACTER_SETS, CsprngGenerator } from '@/core/crypto/csprng-generator'
import { NoCharacterSetSelectedError } from '@/domain/errors/no-character-set-selected-error'

const allEnabled = {
  length: 14,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
}

const containsAny = (value: string, set: string) => [...value].some((char) => set.includes(char))

describe('CsprngGenerator', () => {
  const generator = new CsprngGenerator()

  it('gera senha com o comprimento solicitado', () => {
    expect(generator.generate({ ...allEnabled, length: 8 })).toHaveLength(8)
    expect(generator.generate({ ...allEnabled, length: 64 })).toHaveLength(64)
  })

  it('inclui pelo menos um caractere de cada grupo ativo (RN-01)', () => {
    for (let i = 0; i < 50; i++) {
      const password = generator.generate({ ...allEnabled, length: 8 })
      expect(containsAny(password, CHARACTER_SETS.uppercase)).toBe(true)
      expect(containsAny(password, CHARACTER_SETS.lowercase)).toBe(true)
      expect(containsAny(password, CHARACTER_SETS.numbers)).toBe(true)
      expect(containsAny(password, CHARACTER_SETS.symbols)).toBe(true)
    }
  })

  it('usa apenas os grupos ativos', () => {
    const password = generator.generate({
      length: 32,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
    })

    expect(password).toMatch(/^[0-9]{32}$/)
  })

  it('gera valores diferentes a cada chamada', () => {
    const passwords = new Set(Array.from({ length: 100 }, () => generator.generate(allEnabled)))
    expect(passwords.size).toBe(100)
  })

  it('rejeita quando nenhum grupo de caracteres está ativo', () => {
    expect(() =>
      generator.generate({
        length: 14,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      }),
    ).toThrow(NoCharacterSetSelectedError)
  })

  it('rejeita comprimento menor que a quantidade de grupos ativos', () => {
    expect(() => generator.generate({ ...allEnabled, length: 3 })).toThrow(RangeError)
  })
})
