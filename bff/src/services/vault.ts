import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

export class Vault {
  private encryptionKey: string;

  constructor(encryptionKey: string = process.env.VAULT_ENCRYPTION_KEY || 'dev-key-32-characters-min-length') {
    if (encryptionKey.length < 32) {
      throw new Error('VAULT_ENCRYPTION_KEY must be at least 32 characters');
    }
    this.encryptionKey = encryptionKey;
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Store API key securely
  storeSecret(service: string, secret: string): { service: string; encrypted: string } {
    return {
      service,
      encrypted: this.encrypt(secret),
    };
  }

  // Retrieve API key
  getSecret(encrypted: string): string {
    return this.decrypt(encrypted);
  }
}

export const vault = new Vault();
