export interface PasswordRecord {
  id: string
  encrypted: string
  iv: string
  tag: string
}

export interface IPasswordRepository {
  save(record: PasswordRecord): Promise<void>
  findById(id: string): Promise<PasswordRecord | null>
}
