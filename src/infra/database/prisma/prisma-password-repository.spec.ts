import { describe, expect, it, vi } from 'vitest'

import { PrismaPasswordRepository } from '@/infra/database/prisma/prisma-password-repository'

const record = { id: 'b3d9f1a0-4c22-4e89-8d7b-91c2b5f63d04', encrypted: 'enc', iv: 'iv', tag: 'tag' }

function makeDelegate() {
  return { create: vi.fn().mockResolvedValue({}), findUnique: vi.fn() }
}

describe('PrismaPasswordRepository', () => {
  it('salva o registro cifrado na tabela passwords', async () => {
    const delegate = makeDelegate()
    const repository = new PrismaPasswordRepository(delegate as never)

    await repository.save(record)

    expect(delegate.create).toHaveBeenCalledWith({ data: record })
  })

  it('busca por ID e mapeia para PasswordRecord', async () => {
    const delegate = makeDelegate()
    delegate.findUnique.mockResolvedValueOnce({ ...record, created_at: new Date() })
    const repository = new PrismaPasswordRepository(delegate as never)

    const found = await repository.findById(record.id)

    expect(delegate.findUnique).toHaveBeenCalledWith({ where: { id: record.id } })
    expect(found).toEqual(record)
  })

  it('retorna null quando o ID não existe', async () => {
    const delegate = makeDelegate()
    delegate.findUnique.mockResolvedValueOnce(null)
    const repository = new PrismaPasswordRepository(delegate as never)

    expect(await repository.findById(record.id)).toBeNull()
  })
})
