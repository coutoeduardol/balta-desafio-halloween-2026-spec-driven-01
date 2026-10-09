import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH_BYTES = 32
const IV_LENGTH_BYTES = 12

export interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
}

export interface IDataEncryptor {
  encrypt(plainText: string): EncryptedData
  decrypt(data: EncryptedData): string
}

export class DataEncryptor implements IDataEncryptor {
  private readonly key: Buffer

  constructor(hexKey: string) {
    const key = Buffer.from(hexKey, 'hex')
    if (key.length !== KEY_LENGTH_BYTES || key.toString('hex') !== hexKey.toLowerCase()) {
      throw new Error('ENCRYPTION_KEY deve conter 32 bytes em hexadecimal (64 caracteres).')
    }
    this.key = key
  }

  encrypt(plainText: string): EncryptedData {
    const iv = randomBytes(IV_LENGTH_BYTES)
    const cipher = createCipheriv(ALGORITHM, this.key, iv)
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
    }
  }

  decrypt(data: EncryptedData): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(data.iv, 'hex'))
    decipher.setAuthTag(Buffer.from(data.tag, 'hex'))

    return Buffer.concat([
      decipher.update(Buffer.from(data.encrypted, 'hex')),
      decipher.final(),
    ]).toString('utf8')
  }
}
