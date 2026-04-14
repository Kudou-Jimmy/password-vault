/**
 * 儲存層抽象介面
 *
 * 所有持久化儲存都透過此介面操作，不直接使用 localStorage 或其他底層 API。
 * 未來遷移至 Tauri（檔案系統）、Electron（fs）、Capacitor（Preferences）等平台時，
 * 只需實作新的 adapter，不需修改核心邏輯或 UI。
 *
 * 使用方式：
 *   import { storage } from '@/core/storage';
 *   await storage.get('key');
 *   await storage.set('key', 'value');
 */

export interface StorageAdapter {
  /** 讀取指定 key 的值，不存在時回傳 null */
  get(key: string): Promise<string | null>;
  /** 寫入指定 key 的值 */
  set(key: string, value: string): Promise<void>;
  /** 刪除指定 key */
  remove(key: string): Promise<void>;
  /** 檢查指定 key 是否存在 */
  has(key: string): Promise<boolean>;
}

/**
 * Web 平台的 localStorage 實作
 */
class WebStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async set(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null;
  }
}

// === 未來平台的 adapter 範例 ===
//
// Tauri (檔案系統):
//   class TauriStorageAdapter implements StorageAdapter {
//     async get(key: string) {
//       return await invoke('read_file', { path: `${key}.json` });
//     }
//     ...
//   }
//
// Capacitor (手機):
//   class CapacitorStorageAdapter implements StorageAdapter {
//     async get(key: string) {
//       const { value } = await Preferences.get({ key });
//       return value;
//     }
//     ...
//   }

/** 目前使用的儲存 adapter（Web 版） */
let currentAdapter: StorageAdapter = new WebStorageAdapter();

/** 取得目前的儲存 adapter */
export function getStorage(): StorageAdapter {
  return currentAdapter;
}

/**
 * 替換儲存 adapter（用於切換平台或測試）
 *
 * 範例：
 *   import { setStorage } from '@/core/storage';
 *   setStorage(new TauriStorageAdapter());
 */
export function setStorage(adapter: StorageAdapter): void {
  currentAdapter = adapter;
}

/** 便利的全域存取點 */
export const storage = {
  get: (key: string) => currentAdapter.get(key),
  set: (key: string, value: string) => currentAdapter.set(key, value),
  remove: (key: string) => currentAdapter.remove(key),
  has: (key: string) => currentAdapter.has(key),
};
