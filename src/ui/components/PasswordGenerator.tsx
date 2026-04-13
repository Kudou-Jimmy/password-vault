import { useState, useCallback } from 'react';
import {
  generatePassword,
  generatePassphrase,
  DEFAULT_OPTIONS,
  type GeneratorOptions,
} from '@/features/generator';

interface PasswordGeneratorProps {
  onUse?: (password: string) => void;
}

export default function PasswordGenerator({ onUse }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [wordCount, setWordCount] = useState(4);
  const [result, setResult] = useState(() => generatePassword(DEFAULT_OPTIONS));
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    const pw = mode === 'password' ? generatePassword(options) : generatePassphrase(wordCount);
    setResult(pw);
    setCopied(false);
  }, [mode, options, wordCount]);

  const copy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Auto-clear clipboard after 30 seconds
    setTimeout(() => navigator.clipboard.writeText(''), 30000);
  };

  const toggle = (key: keyof GeneratorOptions) => {
    setOptions((o) => ({ ...o, [key]: !o[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-vault-bg-tertiary rounded-lg p-1">
        <button
          onClick={() => setMode('password')}
          className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
            mode === 'password' ? 'bg-vault-card text-vault-text shadow-sm' : 'text-vault-text-secondary'
          }`}
        >
          隨機密碼
        </button>
        <button
          onClick={() => setMode('passphrase')}
          className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
            mode === 'passphrase' ? 'bg-vault-card text-vault-text shadow-sm' : 'text-vault-text-secondary'
          }`}
        >
          助記詞組
        </button>
      </div>

      <div className="bg-vault-bg-tertiary rounded-lg p-3 font-mono text-sm break-all text-vault-text">
        {result}
      </div>

      <div className="flex gap-2">
        <button
          onClick={generate}
          className="flex-1 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary-hover transition-colors"
        >
          重新產生
        </button>
        <button
          onClick={copy}
          className="flex-1 py-2 rounded-lg border border-vault-border text-vault-text text-sm hover:bg-vault-bg-secondary transition-colors"
        >
          {copied ? '已複製 ✓' : '複製'}
        </button>
        {onUse && (
          <button
            onClick={() => onUse(result)}
            className="flex-1 py-2 rounded-lg border border-primary text-primary text-sm hover:bg-primary/10 transition-colors"
          >
            使用
          </button>
        )}
      </div>

      {mode === 'password' ? (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-vault-text-secondary">長度</span>
              <span className="text-vault-text font-medium">{options.length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) =>
                setOptions((o) => ({ ...o, length: Number(e.target.value) }))
              }
              className="w-full accent-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([
              ['uppercase', '大寫 A-Z'],
              ['lowercase', '小寫 a-z'],
              ['numbers', '數字 0-9'],
              ['symbols', '符號 !@#'],
              ['excludeAmbiguous', '排除易混淆字元'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-vault-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={options[key] as boolean}
                  onChange={() => toggle(key)}
                  className="accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-vault-text-secondary">字數</span>
            <span className="text-vault-text font-medium">{wordCount}</span>
          </div>
          <input
            type="range"
            min={3}
            max={8}
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      )}
    </div>
  );
}
