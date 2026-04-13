import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { VaultData, VaultEntry, EntryType, VaultField } from '@/types';
import * as vault from '@/core/vault';
import { eventBus } from '@/core/events';

interface VaultContextType {
  isLocked: boolean;
  isNewVault: boolean;
  data: VaultData | null;
  error: string | null;

  initialize: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;

  addEntry: (type: EntryType, title: string, fields?: VaultField[], folder?: string, tags?: string[]) => Promise<void>;
  updateEntry: (id: string, updates: Partial<Pick<VaultEntry, 'title' | 'fields' | 'tags' | 'folder' | 'favorite' | 'type'>>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  restoreEntry: (id: string) => Promise<void>;
  permanentlyDeleteEntry: (id: string) => Promise<void>;

  addFolder: (name: string) => Promise<void>;
  removeFolder: (name: string) => Promise<void>;
  addTag: (tag: string) => Promise<void>;

  exportEncrypted: () => string | null;
  importEncrypted: (data: string) => void;

  autoLockMinutes: number;
  setAutoLockMinutes: (minutes: number) => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [isNewVault, setIsNewVault] = useState(!vault.hasExistingVault());
  const [data, setData] = useState<VaultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const passwordRef = useRef<string>('');
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const lock = useCallback(() => {
    passwordRef.current = '';
    setData(null);
    setIsLocked(true);
    eventBus.emit('vault.locked');
  }, []);

  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (autoLockMinutes > 0 && !isLocked) {
      lockTimerRef.current = setTimeout(() => {
        lock();
      }, autoLockMinutes * 60 * 1000);
    }
  }, [autoLockMinutes, isLocked, lock]);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, resetLockTimer));
    resetLockTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetLockTimer));
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [resetLockTimer]);

  const save = useCallback(async (newData: VaultData) => {
    setData(newData);
    await vault.saveVault(newData, passwordRef.current);
  }, []);

  const initialize = useCallback(async (password: string) => {
    try {
      setError(null);
      const newVault = await vault.createVault(password);
      passwordRef.current = password;
      setData(newVault);
      setIsLocked(false);
      setIsNewVault(false);
    } catch (e) {
      setError('建立金庫失敗');
      throw e;
    }
  }, []);

  const unlock = useCallback(async (password: string) => {
    try {
      setError(null);
      const vaultData = await vault.unlockVault(password);
      passwordRef.current = password;
      setData(vaultData);
      setIsLocked(false);
    } catch {
      setError('密碼錯誤');
      throw new Error('密碼錯誤');
    }
  }, []);

  const addEntryFn = useCallback(async (type: EntryType, title: string, fields?: VaultField[], folder?: string, tags?: string[]) => {
    if (!data) return;
    const entry = vault.createEntry(type, title, fields, folder, tags);
    const newData = vault.addEntry(data, entry);
    await save(newData);
  }, [data, save]);

  const updateEntryFn = useCallback(async (id: string, updates: Partial<Pick<VaultEntry, 'title' | 'fields' | 'tags' | 'folder' | 'favorite' | 'type'>>) => {
    if (!data) return;
    const newData = vault.updateEntry(data, id, updates);
    await save(newData);
  }, [data, save]);

  const deleteEntryFn = useCallback(async (id: string) => {
    if (!data) return;
    const newData = vault.softDeleteEntry(data, id);
    await save(newData);
  }, [data, save]);

  const restoreEntryFn = useCallback(async (id: string) => {
    if (!data) return;
    const newData = vault.restoreEntry(data, id);
    await save(newData);
  }, [data, save]);

  const permanentlyDeleteEntryFn = useCallback(async (id: string) => {
    if (!data) return;
    const newData = vault.permanentlyDeleteEntry(data, id);
    await save(newData);
  }, [data, save]);

  const addFolderFn = useCallback(async (name: string) => {
    if (!data) return;
    const newData = vault.addFolder(data, name);
    await save(newData);
  }, [data, save]);

  const removeFolderFn = useCallback(async (name: string) => {
    if (!data) return;
    const newData = vault.removeFolder(data, name);
    await save(newData);
  }, [data, save]);

  const addTagFn = useCallback(async (tag: string) => {
    if (!data) return;
    const newData = vault.addTag(data, tag);
    await save(newData);
  }, [data, save]);

  const exportEncrypted = useCallback(() => vault.exportVaultEncrypted(), []);

  const importEncryptedFn = useCallback((raw: string) => {
    vault.importVaultEncrypted(raw);
    setIsNewVault(false);
    setIsLocked(true);
    setData(null);
    passwordRef.current = '';
  }, []);

  return (
    <VaultContext.Provider
      value={{
        isLocked,
        isNewVault,
        data,
        error,
        initialize,
        unlock,
        lock,
        addEntry: addEntryFn,
        updateEntry: updateEntryFn,
        deleteEntry: deleteEntryFn,
        restoreEntry: restoreEntryFn,
        permanentlyDeleteEntry: permanentlyDeleteEntryFn,
        addFolder: addFolderFn,
        removeFolder: removeFolderFn,
        addTag: addTagFn,
        exportEncrypted,
        importEncrypted: importEncryptedFn,
        autoLockMinutes,
        setAutoLockMinutes,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextType {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within VaultProvider');
  return context;
}
