import type { IDataEncryptor } from '@/core/crypto/data-encryptor'
import type { IPasswordRepository } from '@/core/password/repositories/i-password-repository'
import { PasswordNotFoundError } from '@/domain/errors/password-not-found-error'

export interface GetPasswordByGuidOutput {
  password: string
}

export class GetPasswordByGuid {
  constructor(
    private readonly encryptor: IDataEncryptor,
    private readonly repository: IPasswordRepository,
  ) {}

  async execute(guid: string): Promise<GetPasswordByGuidOutput> {
    const record = await this.repository.findById(guid)

    if (!record) {
      throw new PasswordNotFoundError()
    }

    const password = this.encryptor.decrypt({
      encrypted: record.encrypted,
      iv: record.iv,
      tag: record.tag,
    })

    return { password }
  }
}
