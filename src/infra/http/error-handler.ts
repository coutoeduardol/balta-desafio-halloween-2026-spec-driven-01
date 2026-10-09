import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'

import { NoCharacterSetSelectedError } from '@/domain/errors/no-character-set-selected-error'
import { PasswordNotFoundError } from '@/domain/errors/password-not-found-error'

// RFC 9457 (Problem Details for HTTP APIs).
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  errors?: { field: string; message: string }[]
}

function sendValidationProblem(
  request: FastifyRequest,
  reply: FastifyReply,
  detail: string,
  errors?: ProblemDetails['errors'],
) {
  const problem: ProblemDetails = {
    type: 'about:blank',
    title: 'Bad Request',
    status: 400,
    detail,
    instance: request.url,
    ...(errors ? { errors } : {}),
  }

  return reply.status(400).type('application/problem+json').send(problem)
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return sendValidationProblem(
      request,
      reply,
      'A requisição contém campos inválidos.',
      error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    )
  }

  if (error instanceof NoCharacterSetSelectedError) {
    return sendValidationProblem(request, reply, error.message)
  }

  if (error instanceof PasswordNotFoundError) {
    return reply.status(404).send({ error: 'Not Found', message: error.message })
  }

  // Erros de parsing do Fastify (ex.: JSON malformado).
  if (error.statusCode === 400) {
    return sendValidationProblem(request, reply, error.message)
  }

  request.log.error({ err: error }, 'unhandled error')
  return reply.status(500).send({ error: 'Internal Server Error', message: 'Erro interno do servidor.' })
}
