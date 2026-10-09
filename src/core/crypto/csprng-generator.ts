import { randomBytes } from 'node:crypto'

import { NoCharacterSetSelectedError } from '@/domain/errors/no-character-set-selected-error'

export const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/|~',
} as const

export interface PasswordGenerationOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
}

export interface IPasswordGenerator {
  generate(options: PasswordGenerationOptions): string
}

// RN-03: toda a aleatoriedade vem de crypto.randomBytes, nunca de Math.random().
export class CsprngGenerator implements IPasswordGenerator {
  generate(options: PasswordGenerationOptions): string {
    const sets = this.selectSets(options)

    if (sets.length === 0) {
      throw new NoCharacterSetSelectedError()
    }

    if (options.length < sets.length) {
      throw new RangeError('O comprimento é menor que a quantidade de grupos de caracteres ativos.')
    }

    const pool = sets.join('')

    // RN-01: garante pelo menos 1 caractere de cada grupo ativo.
    const chars = sets.map((set) => this.pick(set))
    while (chars.length < options.length) {
      chars.push(this.pick(pool))
    }

    return this.shuffle(chars).join('')
  }

  private selectSets(options: PasswordGenerationOptions): string[] {
    const sets: string[] = []
    if (options.includeUppercase) sets.push(CHARACTER_SETS.uppercase)
    if (options.includeLowercase) sets.push(CHARACTER_SETS.lowercase)
    if (options.includeNumbers) sets.push(CHARACTER_SETS.numbers)
    if (options.includeSymbols) sets.push(CHARACTER_SETS.symbols)
    return sets
  }

  private pick(set: string): string {
    return set.charAt(this.randomInt(set.length))
  }

  // Rejection sampling para evitar viés de módulo.
  private randomInt(max: number): number {
    const limit = 256 - (256 % max)
    for (;;) {
      const byte = randomBytes(1)[0] as number
      if (byte < limit) return byte % max
    }
  }

  // Fisher-Yates com índice aleatório seguro.
  private shuffle(chars: string[]): string[] {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = this.randomInt(i + 1)
      ;[chars[i], chars[j]] = [chars[j] as string, chars[i] as string]
    }
    return chars
  }
}
