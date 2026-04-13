import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from './crypto';
import { eventBus } from './events';
import type {
  VaultData,
  VaultEntry,
  EncryptedVault,
  EntryType,
  VaultField,
  HistoryRecord,
} from '@/types';
import { DEFAULT_FIELDS } from '@/types';

const STORAGE_KEY = 'password_vault';
const VAULT_VERSION = 1;

function createEmptyVault(): VaultData {
  return {
    meta: {
      version: VAULT_VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    entries: [],
    folders: ['預設'],
    tags: [],
  };
}

function loadEncryptedVault(): EncryptedVault | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

function saveEncryptedVault(vault: EncryptedVault): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
}

export function hasExistingVault(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export async function createVault(password: string): Promise<VaultData> {
  const data = createEmptyVault();
  const json = JSON.stringify(data);
  const { salt, iv, ciphertext } = await encrypt(json, password);

  const encrypted: EncryptedVault = {
    version: VAULT_VERSION,
    salt,
    iv,
    data: ciphertext,
  };

  saveEncryptedVault(encrypted);
  eventBus.emit('vault.unlocked');
  return data;
}

export async function unlockVault(password: string): Promise<VaultData> {
  const encrypted = loadEncryptedVault();
  if (!encrypted) throw new Error('No vault found');

  const json = await decrypt(encrypted.data, password, encrypted.salt, encrypted.iv);
  const data: VaultData = JSON.parse(json);

  eventBus.emit('vault.unlocked');
  return data;
}

export async function saveVault(
  data: VaultData,
  password: string
): Promise<void> {
  data.meta.updatedAt = Date.now();
  const json = JSON.stringify(data);
  const { salt, iv, ciphertext } = await encrypt(json, password);

  const encrypted: EncryptedVault = {
    version: VAULT_VERSION,
    salt,
    iv,
    data: ciphertext,
  };

  saveEncryptedVault(encrypted);
}

export function createEntry(
  type: EntryType,
  title: string,
  fields?: VaultField[],
  folder?: string,
  tags?: string[]
): VaultEntry {
  const now = Date.now();
  return {
    id: uuidv4(),
    type,
    title,
    fields: fields ?? DEFAULT_FIELDS[type].map((f) => ({ ...f })),
    tags: tags ?? [],
    folder: folder ?? '預設',
    favorite: false,
    history: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

export function addEntry(vault: VaultData, entry: VaultEntry): VaultData {
  eventBus.emit('entry.created', entry);
  return {
    ...vault,
    entries: [...vault.entries, entry],
  };
}

export function updateEntry(
  vault: VaultData,
  id: string,
  updates: Partial<Pick<VaultEntry, 'title' | 'fields' | 'tags' | 'folder' | 'favorite' | 'type'>>
): VaultData {
  const entries = vault.entries.map((entry) => {
    if (entry.id !== id) return entry;

    const historyRecord: HistoryRecord = {
      timestamp: Date.now(),
      fields: entry.fields.map((f) => ({ ...f })),
    };

    const updated = {
      ...entry,
      ...updates,
      history: [...entry.history, historyRecord],
      updatedAt: Date.now(),
    };

    eventBus.emit('entry.updated', { previous: entry, current: updated });
    return updated;
  });

  return { ...vault, entries };
}

export function softDeleteEntry(vault: VaultData, id: string): VaultData {
  const entries = vault.entries.map((entry) => {
    if (entry.id !== id) return entry;
    const updated = { ...entry, deletedAt: Date.now() };
    eventBus.emit('entry.deleted', updated);
    return updated;
  });

  return { ...vault, entries };
}

export function restoreEntry(vault: VaultData, id: string): VaultData {
  const entries = vault.entries.map((entry) => {
    if (entry.id !== id) return entry;
    const updated = { ...entry, deletedAt: null };
    eventBus.emit('entry.restored', updated);
    return updated;
  });

  return { ...vault, entries };
}

export function permanentlyDeleteEntry(
  vault: VaultData,
  id: string
): VaultData {
  const entry = vault.entries.find((e) => e.id === id);
  if (entry) eventBus.emit('entry.permanentlyDeleted', entry);

  return {
    ...vault,
    entries: vault.entries.filter((e) => e.id !== id),
  };
}

export function getActiveEntries(vault: VaultData): VaultEntry[] {
  return vault.entries.filter((e) => e.deletedAt === null);
}

export function getDeletedEntries(vault: VaultData): VaultEntry[] {
  return vault.entries.filter((e) => e.deletedAt !== null);
}

export function addFolder(vault: VaultData, name: string): VaultData {
  if (vault.folders.includes(name)) return vault;
  return { ...vault, folders: [...vault.folders, name] };
}

export function removeFolder(vault: VaultData, name: string): VaultData {
  if (name === '預設') return vault;
  const entries = vault.entries.map((e) =>
    e.folder === name ? { ...e, folder: '預設' } : e
  );
  return {
    ...vault,
    entries,
    folders: vault.folders.filter((f) => f !== name),
  };
}

export function addTag(vault: VaultData, tag: string): VaultData {
  if (vault.tags.includes(tag)) return vault;
  return { ...vault, tags: [...vault.tags, tag] };
}

export function exportVaultEncrypted(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  eventBus.emit('vault.exported');
  return raw;
}

export function importVaultEncrypted(data: string): void {
  const parsed: EncryptedVault = JSON.parse(data);
  if (!parsed.version || !parsed.salt || !parsed.iv || !parsed.data) {
    throw new Error('Invalid vault file');
  }
  saveEncryptedVault(parsed);
  eventBus.emit('vault.imported');
}

export function exportPlaintext(
  vault: VaultData,
  format: 'json' | 'csv'
): string {
  const active = getActiveEntries(vault);

  if (format === 'json') {
    const data = active.map((e) => ({
      title: e.title,
      type: e.type,
      folder: e.folder,
      tags: e.tags,
      fields: Object.fromEntries(e.fields.map((f) => [f.key, f.value])),
      createdAt: new Date(e.createdAt).toISOString(),
      updatedAt: new Date(e.updatedAt).toISOString(),
    }));
    return JSON.stringify(data, null, 2);
  }

  const headers = ['標題', '類型', '資料夾', '標籤', '欄位名稱', '欄位值'];
  const rows = active.flatMap((e) =>
    e.fields.map((f) =>
      [e.title, e.type, e.folder, e.tags.join(';'), f.key, f.value]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(',')
    )
  );

  return [headers.join(','), ...rows].join('\n');
}
