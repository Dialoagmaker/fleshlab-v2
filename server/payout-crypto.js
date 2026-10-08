import crypto from 'node:crypto';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { HttpError } from './errors.js';

export class PayoutCipher {
  constructor(config) { this.vaultUrl=config.payoutKeyVaultUrl; this.name=config.payoutKeyVaultSecretName; this.client=this.vaultUrl?new SecretClient(this.vaultUrl,new DefaultAzureCredential()):null; this.cache=new Map(); }
  async key(version) { if (!this.client) throw new HttpError(503,'PAYOUT_ENCRYPTION_UNAVAILABLE','Payout encryption is not configured.'); const cacheKey=version||'current'; if(this.cache.has(cacheKey)) return this.cache.get(cacheKey); try { const secret=await this.client.getSecret(this.name,version||undefined); const key=Buffer.from(secret.value,'base64'); if(key.length!==32) throw new Error('invalid key length'); const value={key,version:secret.properties.version}; this.cache.set(cacheKey,value); this.cache.set(value.version,value); return value; } catch { throw new HttpError(503,'PAYOUT_ENCRYPTION_UNAVAILABLE','Payout encryption is temporarily unavailable.'); } }
  async encrypt(value) { const material=await this.key(); const iv=crypto.randomBytes(12); const cipher=crypto.createCipheriv('aes-256-gcm',material.key,iv); const ciphertext=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]); return {private_ciphertext:ciphertext.toString('base64'),private_iv:iv.toString('base64'),private_tag:cipher.getAuthTag().toString('base64'),encryption_key_version:material.version}; }
  async decrypt(record) { const material=await this.key(record.encryption_key_version); try { const decipher=crypto.createDecipheriv('aes-256-gcm',material.key,Buffer.from(record.private_iv,'base64')); decipher.setAuthTag(Buffer.from(record.private_tag,'base64')); return Buffer.concat([decipher.update(Buffer.from(record.private_ciphertext,'base64')),decipher.final()]).toString('utf8'); } catch { throw new HttpError(409,'PAYOUT_CIPHERTEXT_INVALID','Payout destination cannot be authenticated.'); } }
}
