import type { VaultEntry } from '@/types';

interface EntryListProps {
  entries: VaultEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isTrash?: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  login: '🔑',
  card: '💳',
  identity: '👤',
  note: '📝',
};

export default function EntryList({ entries, selectedId, onSelect, isTrash }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-vault-text-tertiary text-sm">
        {isTrash ? '回收桶是空的' : '沒有項目'}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {entries.map((entry) => {
        const subtitle = entry.fields.find((f) => !f.sensitive && f.value)?.value || '';
        return (
          <button
            key={entry.id}
            onClick={() => onSelect(entry.id)}
            className={`w-full text-left px-4 py-3 border-b border-vault-border transition-colors ${
              selectedId === entry.id
                ? 'bg-primary/10'
                : 'hover:bg-vault-bg-secondary'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{TYPE_ICONS[entry.type] || '🔑'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-vault-text truncate">
                    {entry.title}
                  </span>
                  {entry.favorite && <span className="text-xs">⭐</span>}
                </div>
                {subtitle && (
                  <span className="text-xs text-vault-text-tertiary truncate block">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
