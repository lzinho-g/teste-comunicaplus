import * as Crypto from 'expo-crypto';

export async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    normalized
  );
}