# Plano Técnico: API Geradora e Armazenadora de Senhas

## Contexto
Esta API será um microsserviço utilitário com persistência de dados. Ela foi desenhada para gerar senhas criptograficamente seguras, associá-las a um identificador único universal (GUID/UUID) armazenado em banco de dados, e permitir que desenvolvedores integrem o fluxo recuperando a senha exata em texto limpo quando necessário.

## Arquitetura
Seguindo as diretrizes da `constitution.md`, utilizaremos uma arquitetura em camadas estruturada para suportar acesso a banco de dados de forma isolada (Clean Architecture / Repository Pattern):

```text
src/
├── domain/
│   └── errors/
│       └── password-not-found-error.ts # Erro 404 customizado
├── core/
│   ├── crypto/
│   │   ├── csprng-generator.ts         # Motor de aleatoriedade segura (RN-03)
│   │   └── data-encryptor.ts           # Criptografia reversível para o Banco
│   └── password/
│       ├── repositories/
│       │   └── i-password-repository.ts # Interface do Repositório
│       └── use-cases/
│           ├── generate-and-save-password.ts
│           └── get-password-by-guid.ts
└── infra/
    ├── database/
    │   ├── prisma/
    │   │   └── prisma-password-repository.ts # Implementação com o ORM
    └── http/
        ├── controllers/
        │   ├── generate-password.controller.ts
        │   └── get-password.controller.ts
        └── routes.ts
```

## Decisões
- **Módulo Criptográfico Duplo (`node:crypto`):** 
  1. Usaremos `crypto.randomBytes` para gerar os caracteres aleatórios da senha de forma segura (**RN-03**).
  2. Usaremos o algoritmo **AES-256-GCM** (criptografia simétrica e autenticada) para salvar a senha no banco de dados. Como o requisito exige retornar a senha original (`GET /passwords/<GUID>`), **é proibido usar hashes de via única (como bcrypt) neste projeto**. Uma chave mestra (`ENCRYPTION_KEY`) será injetada via variáveis de ambiente.
- **Identificadores Únicos (GUID/UUID):** O GUID gerado na criação será gerado pela aplicação usando `crypto.randomUUID()` antes de persistir no banco, garantindo o formato padrão internacional.
- **Banco de Dados Relacional:** Utilizaremos PostgreSQL (ou SQLite para desenvolvimento local acelerado) gerenciado via Prisma ORM para garantir transações seguras e indexação rápida por GUID.

## Modelo de Dados
Modelo do banco de dados definido via Prisma Schema:

### Tabela `passwords`
```prisma
model Password {
  id         String   @id @default(uuid()) @db.Uuid // O GUID de busca
  encrypted  String   // A senha criptografada em AES-256-GCM
  iv         String   // Vetor de Inicialização usado na criptografia (Hex)
  tag        String   // Auth Tag do AES-GCM para integridade (Hex)
  created_at DateTime @default(now())

  @@map("passwords")
}
```

## Contratos

### `POST /passwords/generate` (RF-01)
- **Request Body (JSON):**
```json
{
  "length": 16,
  "include_uppercase": true,
  "include_lowercase": true,
  "include_numbers": true,
  "include_symbols": true
}
```
- **Response Body (200 OK):**
```json
{
  "guid": "b3d9f1a0-4c22-4e89-8d7b-91c2b5f63d04",
  "password": "X$7mQ9!kP2vB#zRt"
}
```

### `GET /passwords/:guid` (RF-02)
- **Path Param:** `guid` (String formatada em UUIDv4)
- **Response Body (200 OK):**
```json
{
  "password": "X$7mQ9!kP2vB#zRt"
}
```
- **Response Body se não encontrado (404 Not Found):**
```json
{
  "error": "Not Found",
  "message": "Nenhuma senha encontrada para o GUID fornecido."
}
```

## Riscos
- **Risco 1: Vazamento e comprometimento do Banco de Dados:** Se um atacante invadir o banco de dados e as senhas estiverem em texto limpo, todas as credenciais do ecossistema estarão expostas.
  - *Mitigação:* Implementação obrigatória do `data-encryptor.ts` usando AES-256-GCM. Mesmo se o banco vazar, as senhas estarão ilegíveis sem a chave `ENCRYPTION_KEY` que fica armazenada apenas nas variáveis de ambiente do servidor.
- **Risco 2: Requisição com GUID inválido quebrando o banco (SQL Injection ou erro de parsing):** Tentar buscar strings maliciosas no path parameter.
  - *Mitigação:* O middleware de rota do Fastify usará um schema do Zod que valida se a string recebida no parâmetro `:guid` possui o formato exato de um `uuid()`. Se falhar, retorna `400 Bad Request` antes de tocar no banco.
