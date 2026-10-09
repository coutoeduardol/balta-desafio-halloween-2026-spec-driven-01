export class NoCharacterSetSelectedError extends Error {
  constructor() {
    super('Pelo menos um grupo de caracteres deve estar ativo.')
    this.name = 'NoCharacterSetSelectedError'
  }
}
