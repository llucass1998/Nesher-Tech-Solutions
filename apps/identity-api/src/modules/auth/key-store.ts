import crypto, { KeyObject } from 'crypto';

const generatedKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

function normalizePem(value: string | undefined) {
  return value?.replace(/\\n/g, '\n');
}

export function getIdentityKeyId() {
  return process.env.IDENTITY_JWT_KID || 'identity-local-dev';
}

export function getIdentityPrivateKey() {
  const configured = normalizePem(process.env.IDENTITY_JWT_PRIVATE_KEY);
  if (configured) return configured;
  return generatedKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
}

export function getIdentityPublicKey() {
  const configured = normalizePem(process.env.IDENTITY_JWT_PUBLIC_KEY);
  if (configured) return configured;
  return generatedKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
}

export function getIdentityPublicKeyObject(): KeyObject {
  return crypto.createPublicKey(getIdentityPublicKey());
}

export function getJwks() {
  const jwk = getIdentityPublicKeyObject().export({ format: 'jwk' }) as JsonWebKey;

  return {
    keys: [
      {
        ...jwk,
        kid: getIdentityKeyId(),
        use: 'sig',
        alg: 'RS256',
      },
    ],
  };
}
