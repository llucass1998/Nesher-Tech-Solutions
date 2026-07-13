import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

const generatedKeyPair = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

function normalizePem(value: string | undefined) {
  return value?.replace(/\\n/g, '\n');
}

function getPrivateKey() {
  const configured = normalizePem(process.env.JWT_PRIVATE_KEY);
  if (configured) return configured;
  return generatedKeyPair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
}

function getPublicKey() {
  const configured = normalizePem(process.env.JWT_PUBLIC_KEY);
  if (configured) return configured;
  return generatedKeyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString();
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
}

export function getJwtIssuer() {
  return process.env.JWT_ISSUER || 'logiflow-identity';
}

export function getJwtAudience() {
  const values = (process.env.JWT_AUDIENCE || 'logiflow,logidesk')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length > 0 ? values : ['logiflow'];
}

function getJwtVerifyAudience(): string | [string, ...string[]] {
  const audience = getJwtAudience();
  if (audience.length === 1) return audience[0];
  return audience as [string, ...string[]];
}

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    issuer: getJwtIssuer(),
    audience: getJwtAudience(),
    expiresIn: Number(process.env.ACCESS_TOKEN_TTL_SECONDS || 900),
  });
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, getPublicKey(), {
    algorithms: ['RS256'],
    issuer: getJwtIssuer(),
    audience: getJwtVerifyAudience(),
  });

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload.');
  }

  return decoded as unknown as JwtPayload & AccessTokenPayload;
}

export function createOpaqueToken() {
  return crypto.randomBytes(48).toString('base64url');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashIp(value: string | undefined) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value).digest('hex');
}
