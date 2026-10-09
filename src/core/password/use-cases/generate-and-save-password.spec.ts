import { randomBytes } from 'node:crypto'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CsprngGenerator } from '@/core/crypto/csprng-generator'
import { DataEncryptor } from '@/core/crypto/data-encryptor'
import type { IPasswordRepository } from '@/core/password/repositories/i-password-repository'
import { GenerateAndSavePassword } from '@/core/password/use-cases/generate-and-save-password'
import { NoCharacterSetSelectedError } from '@/domain/errors/no-character-set-selected-error'

const defaultOptions = {
  length: 14,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
}

describe('GenerateAndSavePassword', () => {
  let repository: { save: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> }
  let encryptor: DataEncryptor
  let sut: GenerateAndSavePassword

  beforeEach(() => {
    repository = { save: vi.fn().mockResolvedValue(undefined), findById: vi.fn() }
    encryptor = new DataEncryptor(randomBytes(32).toString('hex'))
    sut = new GenerateAndSavePassword(
      new CsprngGenerator(),
      encryptor,
      repository as IPasswordRepository,
    )
  })

  it('gera a senha, cifra e salva no repositório com um GUID', async () => {
    const result = await sut.execute(defaultOptions)

    expect(result.guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(result.password).toHaveLength(14)
    expect(repository.save).toHaveBeenCalledTimes(1)

    const saved = repository.save.mock.calls[0]?.[0]
    expect(saved.id).toBe(result.guid)
    expect(saved.encrypted).not.toBe(result.password)
    expect(encryptor.decrypt(saved)).toBe(result.password)
  })

  it('orquestra gerador, criptógrafo e repositório na ordem esperada', async () => {
    const generator = { generate: vi.fn().mockReturnValue('Senha#Forte123') }
    const fakeEncryptor = {
      encrypt: vi.fn().mockReturnValue({ encrypted: 'enc', iv: 'iv', tag: 'tag' }),
      decrypt: vi.fn(),
    }
    const useCase = new GenerateAndSavePassword(
      generator,
      fakeEncryptor,
      repository as IPasswordRepository,
      () => 'fixed-guid',
    )

    const result = await useCase.execute(defaultOptions)

    expect(generator.generate).toHaveBeenCalledWith(defaultOptions)
    expect(fakeEncryptor.encrypt).toHaveBeenCalledWith('Senha#Forte123')
    expect(repository.save).toHaveBeenCalledWith({
      id: 'fixed-guid',
      encrypted: 'enc',
      iv: 'iv',
      tag: 'tag',
    })
    expect(result).toEqual({ guid: 'fixed-guid', password: 'Senha#Forte123' })
  })

  it('caso de borda: rejeita quando nenhum grupo de caracteres está ativo', async () => {
    await expect(
      sut.execute({
        length: 14,
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      }),
    ).rejects.toBeInstanceOf(NoCharacterSetSelectedError)

    expect(repository.save).not.toHaveBeenCalled()
  })

  it('propaga falhas do repositório', async () => {
    repository.save.mockRejectedValueOnce(new Error('db down'))

    await expect(sut.execute(defaultOptions)).rejects.toThrow('db down')
  })
})
