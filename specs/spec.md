# Gerador de Senhas Fortes

## Problema
senhas fracas compromentem a segurança dos sistemas

## Objetivo
api para gerar e armazenar senhas fortes e poder recuperar a senha para validação.

## Usuários
- **Desenvolvedores de Integração:** Que precisam consumir a API para gerar senhas temporárias ou sugerir senhas fortes em formulários de cadastro.

## Histórias
- **História 1:** Como desenvolvedor, quero solicitar a API que gere uma senha forte e salve a senha em banco com um GUID.
- **História 2:** Como desenvolvedor, quero solicitar a API que retorne a senha da GUID.

## Requisitos funcionais
- **RF-01 (Geração):** A API deve expor um endpoint `POST /passwords/generate` que aceita parâmetros de customização (comprimento, maiúsculas, minúsculas, números, símbolos).
- **RF-02 (Get):** A API deve expor um endpoint `GET /passwords/<GUID>` que recebe uma GUID no path param e retorna a senha criada.

## Regras de negócio
### RN-01: Parâmetros Padrão de Geração
Se o cliente não enviar parâmetros no payload de geração, os valores padrão obrigatórios serão:
- Comprimento: 14 caracteres.
- Incluir: Pelo menos 1 letra maiúscula, 1 minúscula, 1 número e 1 caractere especial.

### RN-02: Limites de Comprimento
O comprimento da senha gerada ou validada deve respeitar os seguintes limites:
- Mínimo: 8 caracteres.
- Máximo: 64 caracteres.

### RN-03: Segurança do Gerador
A geração de caracteres aleatórios **não deve** utilizar `Math.random()`. Deve ser utilizado o módulo criptográfico nativo do ecossistema (ex: `crypto.getRandomValues` ou `crypto.randomBytes`) para garantir aleatoriedade segura 


## Casos de borda
- **Solicitação de senha sem nenhum caractere válido:** Se o usuário enviar `letters: false, numbers: false, symbols: false` na geração, a API deve rejeitar com `HTTP 400` informando que pelo menos um grupo de caracteres deve ser ativo.

## Fora de escopo
**Interface Gráfica (UI):** Criação de telas, formulários ou extensões de navegador para gerenciar senhas.


## Critérios de aceite
- O endpoint `POST /passwords/generate` retorna `HTTP 200` com a senha no formato `{ "password": "..." }`.
- O endpoint `GET /passwords/<GUID>` retorna `HTTP 200` com a senha no formato `{ "password": "..." }` .