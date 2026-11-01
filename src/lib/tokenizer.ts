import type { Token } from '../types';

/**
 * Unicode-aware tokenizer that splits text into words, punctuation, and whitespace tokens.
 * Preserves line breaks, stanza separations, and hyphenated terms.
 * Uses Unicode property escapes for full international character support.
 */
export function tokenize(text: string): Token[] {
  const normalized = text.normalize('NFC');
  const tokens: Token[] = [];
  // Match: words (with hyphens/apostrophes), whitespace runs, or punctuation chars
  const regex = /(?:[\p{L}\p{M}\p{N}]+(?:[-'\u2019][\p{L}\p{M}\p{N}]+)*)|(?:\s+)|(?:[^\s\p{L}\p{M}\p{N}])/gu;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = regex.exec(normalized)) !== null) {
    const value = match[0];
    let type: Token['type'];

    if (/^\s+$/.test(value)) {
      type = 'whitespace';
    } else if (/^[\p{L}\p{M}\p{N}]/u.test(value)) {
      type = 'word';
    } else {
      type = 'punctuation';
    }

    tokens.push({
      type,
      value,
      normalized: value.normalize('NFC').toLowerCase(),
      index: index++,
    });
  }

  return tokens;
}

/**
 * Extract just word tokens from text.
 */
export function getWords(text: string): Token[] {
  return tokenize(text).filter(t => t.type === 'word');
}

/**
 * Get the first letter of a word, handling multi-byte/accented characters correctly.
 */
export function getFirstLetter(word: string): string {
  const normalized = word.normalize('NFC');
  // Use Array.from to correctly handle multi-byte characters
  const chars = Array.from(normalized);
  return chars[0] || '';
}

/**
 * Compare two strings for equality, Unicode-aware with NFC normalization.
 */
export function compareStrings(a: string, b: string): boolean {
  return a.normalize('NFC').toLowerCase() === b.normalize('NFC').toLowerCase();
}

/**
 * Split text into lines, preserving empty lines as stanza breaks.
 */
export function splitLines(text: string): string[] {
  return text.normalize('NFC').split('\n');
}

/**
 * Deterministic pseudo-random hash for a word based on its position.
 * Returns a value between 0 and 1.
 */
export function positionalHash(index: number, seed: number = 42): number {
  let h = (index * 2654435761 + seed) >>> 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return (h >>> 0) / 0xFFFFFFFF;
}
