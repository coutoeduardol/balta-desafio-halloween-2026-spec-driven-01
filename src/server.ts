import { PrismaClient } from '@prisma/client'

import { CsprngGenerator } from '@/core/crypto/csprng-generator'
import { DataEncryptor } from '@/core/crypto/data-encryptor'
import { GenerateAndSavePassword } from '@/core/password/use-cases/generate-and-save-password'
import { GetPasswordByGuid } from '@/core/password/use-cases/get-password-by-guid'
import { loadEnv } from '@/infra/config/env'
import { PrismaPasswordRepository } from '@/infra/database/prisma/prisma-password-repository'
import { buildApp } from '@/infra/http/app'

const env = loadEnv()

const prisma = new PrismaClient()
const encryptor = new DataEncryptor(env.ENCRYPTION_KEY)
const repository = new PrismaPasswordRepository(prisma.password)

const app = buildApp({
  generateAndSavePassword: new GenerateAndSavePassword(new CsprngGenerator(), encryptor, repository),
  getPasswordByGuid: new GetPasswordByGuid(encryptor, repository),
  logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
})

app.addHook('onClose', async () => {
  await prisma.$disconnect()
})

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (error) {
  app.log.error(error)
  await prisma.$disconnect()
  process.exit(1)
}
