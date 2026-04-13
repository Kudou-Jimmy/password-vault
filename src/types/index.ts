export interface VaultField {
  key: string;
  value: string;
  sensitive: boolean;
}

export interface HistoryRecord {
  timestamp: number;
  fields: VaultField[];
}

export type EntryType = 'login' | 'card' | 'identity' | 'note' | 'bank' | 'debit-card';

export interface VaultEntry {
  id: string;
  type: EntryType;
  title: string;
  fields: VaultField[];
  tags: string[];
  folder: string;
  favorite: boolean;
  history: HistoryRecord[];
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface VaultMeta {
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  meta: VaultMeta;
  entries: VaultEntry[];
  folders: string[];
  tags: string[];
}

export interface EncryptedVault {
  version: number;
  salt: string;
  iv: string;
  data: string;
}

export type EventType =
  | 'entry.created'
  | 'entry.updated'
  | 'entry.deleted'
  | 'entry.restored'
  | 'entry.permanentlyDeleted'
  | 'vault.locked'
  | 'vault.unlocked'
  | 'vault.exported'
  | 'vault.imported';

export interface VaultEvent {
  type: EventType;
  timestamp: number;
  payload?: unknown;
}

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const PASSWORD_STRENGTH_LABELS: Record<PasswordStrength, string> = {
  0: '極弱',
  1: '弱',
  2: '中等',
  3: '強',
  4: '極強',
};

export const PASSWORD_STRENGTH_COLORS: Record<PasswordStrength, string> = {
  0: '#ef4444',
  1: '#f97316',
  2: '#f59e0b',
  3: '#22c55e',
  4: '#16a34a',
};

export const DEFAULT_FIELDS: Record<EntryType, VaultField[]> = {
  login: [
    { key: '網站', value: '', sensitive: false },
    { key: '帳號', value: '', sensitive: false },
    { key: '密碼', value: '', sensitive: true },
    { key: '備註', value: '', sensitive: false },
  ],
  card: [
    { key: '卡號', value: '', sensitive: true },
    { key: '持卡人', value: '', sensitive: false },
    { key: '到期日', value: '', sensitive: false },
    { key: 'CVV', value: '', sensitive: true },
    { key: '預借現金密碼', value: '', sensitive: true },
    { key: '備註', value: '', sensitive: false },
  ],
  identity: [
    { key: '姓名', value: '', sensitive: false },
    { key: '電子郵件', value: '', sensitive: false },
    { key: '電話', value: '', sensitive: false },
    { key: '地址', value: '', sensitive: false },
    { key: '備註', value: '', sensitive: false },
  ],
  bank: [
    { key: '銀行名稱', value: '', sensitive: false },
    { key: '身分證字號', value: '', sensitive: true },
    { key: '使用者代號', value: '', sensitive: true },
    { key: '使用者密碼', value: '', sensitive: true },
    { key: '備註', value: '', sensitive: false },
  ],
  'debit-card': [
    { key: '銀行名稱', value: '', sensitive: false },
    { key: '卡號', value: '', sensitive: true },
    { key: '提款密碼', value: '', sensitive: true },
    { key: '無卡提款密碼', value: '', sensitive: true },
    { key: '磁條密碼', value: '', sensitive: true },
    { key: '備註', value: '', sensitive: false },
  ],
  note: [
    { key: '內容', value: '', sensitive: true },
  ],
};
