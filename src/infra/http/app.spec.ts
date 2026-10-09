import { randomBytes, randomUUID } from 'node:crypto'
import { Writable } from 'node:stream'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { CsprngGenerator } from '@/core/crypto/csprng-generator'
import { DataEncryptor } from '@/core/crypto/data-encryptor'
import type {
  IPasswordRepository,
  PasswordRecord,
} from '@/core/password/repositories/i-password-repository'
import { GenerateAndSavePassword } from '@/core/password/use-cases/generate-and-save-password'
import { GetPasswordByGuid } from '@/core/password/use-cases/get-password-by-guid'
import { buildApp } from '@/infra/http/app'

function makeRepository(): IPasswordRepository {
  const rows = new Map<string, PasswordRecord>()
  return {
    save: vi.fn(async (record: PasswordRecord) => {
      rows.set(record.id, record)
    }),
    findById: vi.fn(async (id: string) => rows.get(id) ?? null),
  }
}

function makeApp(options: { logLines?: string[]; repository?: IPasswordRepository } = {}) {
  const repository = options.repository ?? makeRepository()
  const encryptor = new DataEncryptor(randomBytes(32).toString('hex'))
  const logLines = options.logLines

  const logger = logLines
    ? {
        level: 'info',
        stream: new Writable({
          write(chunk, _encoding, callback) {
            logLines.push(chunk.toString())
            callback()
          },
        }),
      }
    : false

  const app = buildApp({
    generateAndSavePassword: new GenerateAndSavePassword(new CsprngGenerator(), encryptor, repository),
    getPasswordByGuid: new GetPasswordByGuid(encryptor, repository),
    logger,
  })

  return { app, repository }
}

describe('HTTP', () => {
  let app: ReturnType<typeof makeApp>['app']

  afterEach(async () => {
    await app.close()
  })

  describe('POST /passwords/generate (RF-01)', () => {
    it('retorna 200 com guid e senha usando os parâmetros enviados', async () => {
      ;({ app } = makeApp())

      const response = await app.inject({
        method: 'POST',
        url: '/passwords/generate',
        payload: {
          length: 20,
          include_uppercase: true,
          include_lowercase: false,
          include_numbers: true,
          include_symbols: false,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = response.json()
      expect(body.guid).toMatch(/^[0-9a-f-]{36}$/)
      expect(body.password).toMatch(/^[A-Z0-9]{20}$/)
    })

    it('aplica os padrões da RN-01 quando nenhum parâmetro é enviado', async () => {
      ;({ app } = makeApp())

      const withoutBody = await app.inject({ method: 'POST', url: '/passwords/generate' })
      const emptyJson = await app.inject({
        method: 'POST',
        url: '/passwords/generate',
        headers: { 'content-type': 'application/json' },
        payload: '',
      })
      const emptyObject = await app.inject({ method: 'POST', url: '/passwords/generate', payload: {} })

      for (const response of [withoutBody, emptyJson, emptyObject]) {
        expect(response.statusCode).toBe(200)
        const { password } = response.json()
        expect(password).toHaveLength(14)
        expect(password).toMatch(/[A-Z]/)
        expect(password).toMatch(/[a-z]/)
        expect(password).toMatch(/[0-9]/)
        expect(password).toMatch(/[^A-Za-z0-9]/)
      }
    })

    it.each([7, 65, 10.5, '16'])('retorna 400 ProblemDetails para length inválido (%s) - RN-02', async (length) => {
      ;({ app } = makeApp())

      const response = await app.inject({
        method: 'POST',
        url: '/passwords/generate',
        payload: { length },
      })

      expect(response.statusCode).toBe(400)
      expect(response.headers['content-type']).toContain('application/problem+json')
      expect(response.json()).toMatchObject({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        instance: '/passwords/generate',
        errors: [{ field: 'length' }],
      })
    })

    it('aceita os limites 8 e 64 (RN-02)', async () => {
      ;({ app } = makeApp())

      for (const length of [8, 64]) {
        const response = await app.inject({ method: 'POST', url: '/passwords/generate', payload: { length } })
        expect(response.statusCode).toBe(200)
        expect(response.json().password).toHaveLength(length)
      }
    })

    it('caso de borda: retorna 400 quando nenhum grupo de caracteres está ativo', async () => {
      const { app: instance, repository } = makeApp()
      app = instance

      const response = await app.inject({
        method: 'POST',
        url: '/passwords/generate',
        payload: {
          include_uppercase: false,
          include_lowercase: false,
          include_numbers: false,
          include_symbols: false,
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.headers['content-type']).toContain('application/problem+json')
      expect(response.json()).toMatchObject({
        status: 400,
        detail: 'Pelo menos um grupo de caracteres deve estar ativo.',
      })
      expect(repository.save).not.toHaveBeenCalled()
    })

    it('retorna 400 ProblemDetails para JSON malformado', async () => {
      ;({ app } = makeApp())

      const response = await app.inject({
        method: 'POST',
        url: '/passwords/generate',
        headers: { 'content-type': 'application/json' },
        payload: '{ invalido',
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({ status: 400, title: 'Bad Request' })
    })

    it('retorna 500 sem expor detalhes quando ocorre erro inesperado', async () => {
      const repository = makeRepository()
      vi.mocked(repository.save).mockRejectedValueOnce(new Error('db down'))
      ;({ app } = makeApp({ repository }))

      const response = await app.inject({ method: 'POST', url: '/passwords/generate' })

      expect(response.statusCode).toBe(500)
      expect(response.body).not.toContain('db down')
    })
  })

  describe('GET /passwords/:guid (RF-02)', () => {
    it('retorna 200 com a senha original em texto limpo', async () => {
      ;({ app } = makeApp())

      const created = await app.inject({ method: 'POST', url: '/passwords/generate' })
      const { guid, password } = created.json()

      const response = await app.inject({ method: 'GET', url: `/passwords/${guid}` })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ password })
    })

    it('retorna 404 quando o GUID não existe', async () => {
      ;({ app } = makeApp())

      const response = await app.inject({ method: 'GET', url: `/passwords/${randomUUID()}` })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({
        error: 'Not Found',
        message: 'Nenhuma senha encontrada para o GUID fornecido.',
      })
    })

    it.each(["1' OR '1'='1", 'nao-e-uuid', 'b3d9f1a0-4c22-1e89-8d7b-91c2b5f63d04'])(
      'retorna 400 ProblemDetails sem consultar o banco para GUID inválido (%s)',
      async (guid) => {
        const { app: instance, repository } = makeApp()
        app = instance

        const response = await app.inject({
          method: 'GET',
          url: `/passwords/${encodeURIComponent(guid)}`,
        })

        expect(response.statusCode).toBe(400)
        expect(response.headers['content-type']).toContain('application/problem+json')
        expect(response.json()).toMatchObject({ status: 400, errors: [{ field: 'guid' }] })
        expect(repository.findById).not.toHaveBeenCalled()
      },
    )
  })

  describe('Higienização de logs (T-11)', () => {
    it('mascara senhas geradas e recuperadas nos logs', async () => {
      const logLines: string[] = []
      ;({ app } = makeApp({ logLines }))

      const created = await app.inject({ method: 'POST', url: '/passwords/generate', payload: {} })
      const { guid, password } = created.json()
      await app.inject({ method: 'GET', url: `/passwords/${guid}` })
      app.log.info({ password }, 'log acidental com senha crua')

      const output = logLines.join('')
      expect(output).toContain('response payload')
      expect(output).toContain('[REDACTED]')
      expect(output).toContain(guid)
      expect(output).not.toContain(password)
    })
  })
})
