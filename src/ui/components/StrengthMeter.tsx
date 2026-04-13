import zxcvbn from 'zxcvbn';
import { PASSWORD_STRENGTH_LABELS, PASSWORD_STRENGTH_COLORS, type PasswordStrength } from '@/types';

interface StrengthMeterProps {
  password: string;
}

export default function StrengthMeter({ password }: StrengthMeterProps) {
  if (!password) return null;

  const result = zxcvbn(password);
  const score = result.score as PasswordStrength;
  const label = PASSWORD_STRENGTH_LABELS[score];
  const color = PASSWORD_STRENGTH_COLORS[score];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              backgroundColor: i <= score ? color : 'var(--color-vault-border)',
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span style={{ color }}>{label}</span>
        {result.crack_times_display.offline_slow_hashing_1e4_per_second && (
          <span className="text-vault-text-tertiary">
            破解時間: {result.crack_times_display.offline_slow_hashing_1e4_per_second as string}
          </span>
        )}
      </div>
    </div>
  );
}
