import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';

export default function LockScreen() {
  const { isNewVault, initialize, unlock, error } = useVault();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const { importEncrypted } = useVault();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (isNewVault) {
      if (password.length < 8) {
        setLocalError('主密碼至少需要 8 個字元');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('兩次輸入的密碼不一致');
        return;
      }
    }

    setLoading(true);
    try {
      if (isNewVault) {
        await initialize(password);
      } else {
        await unlock(password);
      }
    } catch {
      // error is set in context
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importEncrypted(reader.result as string);
        setShowImport(false);
        setLocalError('');
      } catch {
        setLocalError('無效的金庫檔案');
      }
    };
    reader.readAsText(file);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-vault-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-vault-text">
            {isNewVault ? '建立密碼金庫' : '解鎖密碼金庫'}
          </h1>
          <p className="text-vault-text-secondary mt-2 text-sm">
            {isNewVault
              ? '設定一組主密碼來保護你的資料'
              : '輸入主密碼以解鎖'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="主密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-vault-border bg-vault-input text-vault-text placeholder-vault-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          {isNewVault && (
            <div>
              <input
                type="password"
                placeholder="確認主密碼"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-vault-border bg-vault-input text-vault-text placeholder-vault-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {displayError && (
            <p className="text-danger text-sm text-center">{displayError}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? '處理中...' : isNewVault ? '建立金庫' : '解鎖'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {!showImport ? (
            <button
              onClick={() => setShowImport(true)}
              className="text-sm text-vault-text-secondary hover:text-primary transition-colors"
            >
              匯入既有金庫
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-vault-text-secondary">選擇加密金庫檔案</p>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="text-sm text-vault-text-secondary"
              />
              <button
                onClick={() => setShowImport(false)}
                className="block mx-auto text-sm text-vault-text-tertiary hover:text-vault-text-secondary"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
