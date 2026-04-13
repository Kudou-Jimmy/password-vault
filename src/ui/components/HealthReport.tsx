import zxcvbn from 'zxcvbn';
import type { VaultEntry } from '@/types';
import { getActiveEntries } from '@/core/vault';
import { useVault } from '@/contexts/VaultContext';
import { PASSWORD_STRENGTH_COLORS, type PasswordStrength } from '@/types';

export default function HealthReport({ onClose }: { onClose: () => void }) {
  const { data } = useVault();
  if (!data) return null;

  const entries = getActiveEntries(data);

  const passwords = entries
    .filter((e) => e.type === 'login' || e.type === 'bank')
    .map((e) => {
      const pw = e.fields.find((f) => f.key === '密碼' || f.key === '使用者密碼')?.value || '';
      return { entry: e, password: pw, score: pw ? zxcvbn(pw).score as PasswordStrength : 0 };
    })
    .filter((p) => p.password);

  const weak = passwords.filter((p) => p.score <= 1);
  const strong = passwords.filter((p) => p.score >= 3);

  const duplicates: { password: string; entries: VaultEntry[] }[] = [];
  const pwMap = new Map<string, VaultEntry[]>();
  passwords.forEach(({ entry, password }) => {
    const list = pwMap.get(password) || [];
    list.push(entry);
    pwMap.set(password, list);
  });
  pwMap.forEach((entries, password) => {
    if (entries.length > 1) duplicates.push({ password, entries });
  });

  const DAY_90 = 90 * 24 * 60 * 60 * 1000;
  const old = passwords.filter((p) => Date.now() - p.entry.updatedAt > DAY_90);

  const totalIssues = weak.length + duplicates.length + old.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-vault-card rounded-xl shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-vault-text">金庫健康報告</h3>
          <button onClick={onClose} className="text-vault-text-tertiary hover:text-vault-text">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-vault-bg-secondary">
            <div className="text-2xl font-bold text-vault-text">{passwords.length}</div>
            <div className="text-xs text-vault-text-tertiary">總密碼數</div>
          </div>
          <div className="p-3 rounded-lg bg-vault-bg-secondary">
            <div className="text-2xl font-bold" style={{ color: totalIssues === 0 ? '#22c55e' : '#ef4444' }}>
              {totalIssues}
            </div>
            <div className="text-xs text-vault-text-tertiary">問題數</div>
          </div>
          <div className="p-3 rounded-lg bg-vault-bg-secondary">
            <div className="text-2xl font-bold text-vault-text">{strong.length}</div>
            <div className="text-xs text-vault-text-tertiary">強密碼</div>
          </div>
        </div>

        <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-vault-bg-tertiary">
          {passwords.map((p, i) => (
            <div
              key={i}
              className="flex-1 transition-colors"
              style={{ backgroundColor: PASSWORD_STRENGTH_COLORS[p.score] }}
            />
          ))}
        </div>

        {weak.length > 0 && (
          <Section title={`⚠️ 弱密碼 (${weak.length})`}>
            {weak.map((p) => (
              <EntryRow key={p.entry.id} entry={p.entry} detail={`強度: ${p.score}/4`} />
            ))}
          </Section>
        )}

        {duplicates.length > 0 && (
          <Section title={`🔄 重複密碼 (${duplicates.length} 組)`}>
            {duplicates.map((d, i) => (
              <div key={i} className="text-sm text-vault-text-secondary">
                {d.entries.map((e) => e.title).join(', ')} — 使用相同密碼
              </div>
            ))}
          </Section>
        )}

        {old.length > 0 && (
          <Section title={`⏰ 超過 90 天未更新 (${old.length})`}>
            {old.map((p) => (
              <EntryRow
                key={p.entry.id}
                entry={p.entry}
                detail={`上次更新: ${new Date(p.entry.updatedAt).toLocaleDateString('zh-TW')}`}
              />
            ))}
          </Section>
        )}

        {totalIssues === 0 && (
          <div className="text-center text-success py-4">
            <div className="text-3xl mb-2">🎉</div>
            <p className="font-medium">所有密碼狀態良好！</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-vault-text">{title}</h4>
      <div className="space-y-1 pl-2">{children}</div>
    </div>
  );
}

function EntryRow({ entry, detail }: { entry: VaultEntry; detail: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-vault-text-secondary">{entry.title}</span>
      <span className="text-vault-text-tertiary text-xs">{detail}</span>
    </div>
  );
}
