import type { PrismaClient } from '@prisma/client'

import type { IPasswordRepository, PasswordRecord } from '@/core/password/repositories/i-password-repository'

type PasswordDelegate = Pick<PrismaClient['password'], 'create' | 'findUnique'>

export class PrismaPasswordRepository implements IPasswordRepository {
  constructor(private readonly passwords: PasswordDelegate) {}

  async save(record: PasswordRecord): Promise<void> {
    await this.passwords.create({
      data: {
        id: record.id,
        encrypted: record.encrypted,
        iv: record.iv,
        tag: record.tag,
      },
    })
  }

  async findById(id: string): Promise<PasswordRecord | null> {
    const row = await this.passwords.findUnique({ where: { id } })
    if (!row) return null

    return { id: row.id, encrypted: row.encrypted, iv: row.iv, tag: row.tag }
  }
}
