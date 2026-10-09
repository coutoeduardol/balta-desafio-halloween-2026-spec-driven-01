import { randomUUID } from 'node:crypto'

import type { IPasswordGenerator, PasswordGenerationOptions } from '@/core/crypto/csprng-generator'
import type { IDataEncryptor } from '@/core/crypto/data-encryptor'
import type { IPasswordRepository } from '@/core/password/repositories/i-password-repository'

export interface GenerateAndSavePasswordOutput {
  guid: string
  password: string
}

export class GenerateAndSavePassword {
  constructor(
    private readonly generator: IPasswordGenerator,
    private readonly encryptor: IDataEncryptor,
    private readonly repository: IPasswordRepository,
    private readonly idGenerator: () => string = randomUUID,
  ) {}

  async execute(options: PasswordGenerationOptions): Promise<GenerateAndSavePasswordOutput> {
    const password = this.generator.generate(options)
    const guid = this.idGenerator()
    const { encrypted, iv, tag } = this.encryptor.encrypt(password)

    await this.repository.save({ id: guid, encrypted, iv, tag })

    return { guid, password }
  }
}
