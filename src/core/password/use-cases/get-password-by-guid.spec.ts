import { randomBytes, randomUUID } from 'node:crypto'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DataEncryptor } from '@/core/crypto/data-encryptor'
import type { IPasswordRepository } from '@/core/password/repositories/i-password-repository'
import { GetPasswordByGuid } from '@/core/password/use-cases/get-password-by-guid'
import { PasswordNotFoundError } from '@/domain/errors/password-not-found-error'

describe('GetPasswordByGuid', () => {
  let repository: { save: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> }
  let encryptor: DataEncryptor
  let sut: GetPasswordByGuid

  beforeEach(() => {
    repository = { save: vi.fn(), findById: vi.fn() }
    encryptor = new DataEncryptor(randomBytes(32).toString('hex'))
    sut = new GetPasswordByGuid(encryptor, repository as IPasswordRepository)
  })

  it('busca o registro cifrado, decifra e retorna a senha limpa', async () => {
    const guid = randomUUID()
    repository.findById.mockResolvedValueOnce({ id: guid, ...encryptor.encrypt('X$7mQ9!kP2vB#zRt') })

    const result = await sut.execute(guid)

    expect(repository.findById).toHaveBeenCalledWith(guid)
    expect(result).toEqual({ password: 'X$7mQ9!kP2vB#zRt' })
  })

  it('lança PasswordNotFoundError (404) quando o GUID não existe', async () => {
    repository.findById.mockResolvedValueOnce(null)

    await expect(sut.execute(randomUUID())).rejects.toBeInstanceOf(PasswordNotFoundError)
  })

  it('falha quando o dado armazenado foi adulterado', async () => {
    const guid = randomUUID()
    const data = encryptor.encrypt('senha')
    repository.findById.mockResolvedValueOnce({ id: guid, ...data, tag: '0'.repeat(32) })

    await expect(sut.execute(guid)).rejects.toThrow()
  })
})
