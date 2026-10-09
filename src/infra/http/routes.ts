import type { FastifyInstance } from 'fastify'

import type { GeneratePasswordController } from '@/infra/http/controllers/generate-password.controller'
import type { GetPasswordController } from '@/infra/http/controllers/get-password.controller'

export interface PasswordControllers {
  generatePassword: GeneratePasswordController
  getPassword: GetPasswordController
}

export function registerPasswordRoutes(app: FastifyInstance, controllers: PasswordControllers) {
  app.post('/passwords/generate', (request, reply) =>
    controllers.generatePassword.handle(request, reply),
  )
  app.get('/passwords/:guid', (request, reply) => controllers.getPassword.handle(request, reply))
}
