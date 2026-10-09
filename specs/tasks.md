# Tarefas

| ID | Tarefa | Origem | Depende de | Concluída quando |
|---|---|---|---|---|
| **T-01** | Criar projeto e estrutura de pastas | Constituição | - | O projeto compila com TypeScript rodando sem erros. |
| **T-02** | Configurar o Prisma ORM e Schema | Plan (Modelo de Dados) | T-01 | O comando `prisma migrate dev` roda com sucesso criando a tabela `passwords`. |
| **T-03** | Criar o Motor CSPRNG de Geração Segura | Spec (RN-03) / Plan | T-01 | O arquivo `csprng-generator.ts` gera strings aleatórias baseadas nos booleanos de entrada usando `node:crypto`. |
| **T-04** | Criar o Criptógrafo Bidirecional (AES-256-GCM) | Plan (Riscos) | T-01 | O arquivo `data-encryptor.ts` cifra uma string e consegue decifrá-la de volta exatamente ao valor original. |
| **T-05** | Criar Contrato e Implementação do Repositório | Plan (Arquitetura) | T-02 | O arquivo `prisma-password-repository.ts` possui os métodos de salvar e buscar por ID funcionando. |
| **T-06** | Implementar Caso de Uso: Geração e Salvamento | Spec (RF-01) / Plan | T-03, T-04, T-05 | A classe `GenerateAndSavePassword` orquestra a geração, a criptografia e salva no repositório. |
| **T-07** | Implementar Caso de Uso: Recuperação por GUID | Spec (RF-02) / Plan | T-04, T-05 | A classe `GetPasswordByGuid` busca o dado cifrado no repositório, decifra e retorna a senha limpa. |
| **T-08** | Escrever Testes Unitários dos Casos de Uso | Constituição (Qualidade) | T-06, T-07 | Os testes rodam via Vitest cobrindo fluxos de sucesso, erro 404 (GUID inexistente) e caso de borda sem caracteres válidos. |
| **T-09** | Criar Rota HTTP: `POST /passwords/generate` | Spec (RF-01) / Plan | T-06 | O endpoint recebe a requisição, valida com Zod conforme a RN-02 e retorna o GUID e a senha com status 200. |
| **T-10** | Criar Rota HTTP: `GET /passwords/:guid` | Spec (RF-02) / Plan | T-07 | O endpoint recebe o GUID no path, valida o formato UUID via Zod e retorna a senha em texto limpo com status 200. |
| **T-11** | Adicionar Middleware de Higienização de Logs | Plan (Riscos) | T-09, T-10 | Os logs do servidor mascaram os payloads que contenham propriedades de senhas geradas ou recuperadas. |
