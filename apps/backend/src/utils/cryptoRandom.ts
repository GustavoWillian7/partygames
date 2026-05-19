import { randomInt } from 'crypto';

/**
 * Retorna um inteiro aleatório em [0, max).
 * Usa crypto.randomInt para aleatoriedade criptograficamente segura.
 */
export function secureRandomInt(max: number): number {
  if (max <= 0) return 0;
  return randomInt(0, max);
}

/**
 * Fisher-Yates shuffle com aleatoriedade criptograficamente segura.
 */
export function secureShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
