export interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'O0l1I';

export const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

export function generatePassword(options: GeneratorOptions): string {
  let charset = '';
  if (options.uppercase) charset += UPPERCASE;
  if (options.lowercase) charset += LOWERCASE;
  if (options.numbers) charset += NUMBERS;
  if (options.symbols) charset += SYMBOLS;

  if (options.excludeAmbiguous) {
    charset = charset
      .split('')
      .filter((c) => !AMBIGUOUS.includes(c))
      .join('');
  }

  if (charset.length === 0) {
    charset = LOWERCASE + NUMBERS;
  }

  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((n) => charset[n % charset.length])
    .join('');
}

const WORD_LIST = [
  'apple', 'brave', 'cloud', 'dance', 'eagle', 'flame', 'grape', 'honor',
  'ivory', 'jewel', 'kneel', 'lemon', 'magic', 'noble', 'ocean', 'pearl',
  'quest', 'river', 'stone', 'tiger', 'ultra', 'vivid', 'whale', 'xenon',
  'yield', 'zebra', 'amber', 'blaze', 'coral', 'drift', 'ember', 'frost',
  'gleam', 'haven', 'index', 'jolly', 'kayak', 'lunar', 'maple', 'nexus',
  'oasis', 'pixel', 'quilt', 'relay', 'solar', 'torch', 'unity', 'vapor',
  'waltz', 'xerox', 'yacht', 'zephyr',
];

export function generatePassphrase(wordCount: number = 4, separator: string = '-'): string {
  const array = new Uint32Array(wordCount);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((n) => WORD_LIST[n % WORD_LIST.length])
    .join(separator);
}
