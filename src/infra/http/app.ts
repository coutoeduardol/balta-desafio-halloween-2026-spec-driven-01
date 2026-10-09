import fastify, { type FastifyServerOptions } from 'fastify'

import type { GenerateAndSavePassword } from '@/core/password/use-cases/generate-and-save-password'
import type { GetPasswordByGuid } from '@/core/password/use-cases/get-password-by-guid'
import { GeneratePasswordController } from '@/infra/http/controllers/generate-password.controller'
import { GetPasswordController } from '@/infra/http/controllers/get-password.controller'
import { errorHandler } from '@/infra/http/error-handler'
import { LOG_MASK, logRedactPaths, registerLogSanitizer } from '@/infra/http/log-sanitizer'
import { registerPasswordRoutes } from '@/infra/http/routes'

export interface AppDependencies {
  generateAndSavePassword: GenerateAndSavePassword
  getPasswordByGuid: GetPasswordByGuid
  logger?: FastifyServerOptions['logger']
}

export function buildApp(deps: AppDependencies) {
  const logger =
    deps.logger && typeof deps.logger === 'object'
      ? { ...deps.logger, redact: { paths: logRedactPaths, censor: LOG_MASK } }
      : (deps.logger ?? false)

  const app = fastify({ logger })

  // RN-01: corpo vazio com Content-Type JSON equivale a "nenhum parâmetro enviado".
  const defaultJsonParser = app.getDefaultJsonParser('error', 'error')
  app.removeContentTypeParser('application/json')
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    const text = body.toString()
    if (text.trim() === '') {
      done(null, {})
      return
    }
    defaultJsonParser(request, text, done)
  })

  app.setErrorHandler(errorHandler)
  registerLogSanitizer(app)

  registerPasswordRoutes(app, {
    generatePassword: new GeneratePasswordController(deps.generateAndSavePassword),
    getPassword: new GetPasswordController(deps.getPasswordByGuid),
  })

  return app
}
