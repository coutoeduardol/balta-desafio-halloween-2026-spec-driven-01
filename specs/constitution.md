# Constituição do projeto

Api simples para cadastro e recuperação de senhas fortes.

## Stack
- **Linguagem:** TypeScript (v5+)
- **Runtime:** Node.js (v20+) com Fastify
- **Banco de Dados:** SqlLite
- **Testes:** Vitest

## Arquitetura
- Clean Architeture (camadas separadas de controller, usercase, repository)
- Erro de validação sempre retorna 400 com ProblemDetails

## Qualidade
- **Cobertura:** Mínimo de 85% de cobertura de linhas.
- **Estratégia:** Cada caso de uso deve possuir testes unitários isolados utilizando Mocks para os repositórios.

## Convenções
### 🔤 Nomenclatura (Naming Conventions)
- **Arquivos e Pastas:** Usar `kebab-case` (ex: `register-user-use-case.ts`). Pastas de módulos devem ser no plural (ex: `users/`, `products/`).
- **Classes e Interfaces:** Usar `PascalCase` (ex: `PrismaUsersRepository`). Interfaces de contrato de repositório devem começar com "I" (ex: `IUsersRepository`).
- **Funções, Variáveis e Métodos:** Usar `camelCase` (ex: `findByEmail`).
- **Tabelas do Banco (Prisma):** Usar `snake_case` e plural (ex: `users`, `refresh_tokens`).

### 🗺️ Estrutura de Arquivos e Código
- **Exportações:** Preferir exportações nomeadas (`export class...`) em vez de exportações padrões (`export default`).
- **Ordem de Importação:** 
  1. Módulos nativos do Node (ex: `path`, `crypto`).
  2. Bibliotecas externas (ex: `fastify`, `zod`).
  3. Código interno do projeto usando caminhos absolutos com aliases (ex: `@/modules/...`).

### 💬 Mensagens de Commit e Git
- **Commits:** Seguir estritamente o padrão **Conventional Commits** (ex: `feat(auth): add jwt generation`, `fix(users): validate email format`).
- **Branches:** Usar o padrão `tipo/id-descricao-curta` (ex: `feature/task-03-register-usecase` ou `bugfix/task-05-fix-validation`).

## Governança

### 🔄 Ciclo de Vida da Especificação (Spec Lifecycle)
- **A Especificação é a Lei:** O código reflete a spec, a spec não corre atrás do código. Nenhuma linha de código deve ser escrita sem uma tarefa correspondente em `tasks.md` originada por uma `spec.md`.
- **Mudanças no Escopo:** Se durante o desenvolvimento for descoberto que uma spec está errada ou incompleta, o desenvolvimento é **pausado**. A `spec.md` e o `plan.md` devem ser atualizados e aprovados antes do código ser alterado.

### 👥 Revisão de Código e Aprovação (Code Review)
- **Aprovação Humana:** Engenheiros de IA ou juniores podem gerar o código, mas o Merge para a branch principal (`main` ou `develop`) exige a aprovação de pelo menos 1 Engenheiro de Software Sênior (Tech Lead).
- **Critérios de Aceite para PR (Pull Request):**
  - O pipeline de CI (Integração Contínua) deve passar sem erros (Lint, Tipagem e Testes).
  - A cobertura de testes deve atingir a meta estipulada nesta constituição.
  - O código gerado deve referenciar explicitamente a `TASK-ID` correspondente no corpo do PR.

### 🪵 Versionamento e Releases
- **Versionamento:** O projeto segue o **Semantic Versioning (SemVer)** (`MAJOR.MINOR.PATCH`).
- **Histórico:** Alterações críticas na arquitetura global ou nesta constituição exigem um documento de RFC (Request for Comments) aprovado pelo time de arquitetura.
