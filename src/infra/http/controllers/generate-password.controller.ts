import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import type { GenerateAndSavePassword } from '@/core/password/use-cases/generate-and-save-password'

// RN-01 (valores padrão) e RN-02 (limites de comprimento).
export const generatePasswordBodySchema = z.object({
  length: z
    .number({ error: 'length deve ser um número inteiro.' })
    .int('length deve ser um número inteiro.')
    .min(8, 'length deve ser no mínimo 8.')
    .max(64, 'length deve ser no máximo 64.')
    .default(14),
  include_uppercase: z.boolean().default(true),
  include_lowercase: z.boolean().default(true),
  include_numbers: z.boolean().default(true),
  include_symbols: z.boolean().default(true),
})

export class GeneratePasswordController {
  constructor(private readonly generateAndSavePassword: GenerateAndSavePassword) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const body = generatePasswordBodySchema.parse(request.body ?? {})

    const result = await this.generateAndSavePassword.execute({
      length: body.length,
      includeUppercase: body.include_uppercase,
      includeLowercase: body.include_lowercase,
      includeNumbers: body.include_numbers,
      includeSymbols: body.include_symbols,
    })

    return reply.status(200).send({ guid: result.guid, password: result.password })
  }
}
