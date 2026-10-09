export class PasswordNotFoundError extends Error {
  constructor() {
    super('Nenhuma senha encontrada para o GUID fornecido.')
    this.name = 'PasswordNotFoundError'
  }
}
