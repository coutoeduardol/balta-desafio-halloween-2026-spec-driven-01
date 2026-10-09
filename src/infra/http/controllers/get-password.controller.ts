import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

import type { GetPasswordByGuid } from '@/core/password/use-cases/get-password-by-guid'

export const getPasswordParamsSchema = z.object({
  guid: z.uuid({ version: 'v4', error: 'guid deve ser um UUID v4 válido.' }),
})

export class GetPasswordController {
  constructor(private readonly getPasswordByGuid: GetPasswordByGuid) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Plan (Risco 2): valida o formato antes de tocar no banco.
    const { guid } = getPasswordParamsSchema.parse(request.params)

    const result = await this.getPasswordByGuid.execute(guid)

    return reply.status(200).send({ password: result.password })
  }
}
