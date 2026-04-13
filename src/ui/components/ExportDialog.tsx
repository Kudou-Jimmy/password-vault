import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';

interface ExportDialogProps {
  onClose: () => void;
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const { exportEncrypted, exportPlaintext } = useVault();
  const [confirmPlaintext, setConfirmPlaintext] = useState(false);

  const download = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEncryptedExport = () => {
    const data = exportEncrypted();
    if (data) {
      download(data, `vault-${Date.now()}.json`, 'application/json');
      onClose();
    }
  };

  const handlePlaintextExport = (format: 'json' | 'csv') => {
    const data = exportPlaintext(format);
    if (data) {
      const ext = format === 'json' ? 'json' : 'csv';
      const type = format === 'json' ? 'application/json' : 'text/csv';
      download(data, `vault-plaintext-${Date.now()}.${ext}`, type);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-vault-card rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-vault-text">匯出金庫</h3>

        <button
          onClick={handleEncryptedExport}
          className="w-full p-4 text-left rounded-lg border border-vault-border hover:bg-vault-bg-secondary transition-colors"
        >
          <div className="font-medium text-vault-text text-sm">🔒 加密匯出</div>
          <p className="text-xs text-vault-text-tertiary mt-1">
            匯出加密的金庫檔案，可用於備份或轉移到其他裝置
          </p>
        </button>

        {!confirmPlaintext ? (
          <button
            onClick={() => setConfirmPlaintext(true)}
            className="w-full p-4 text-left rounded-lg border border-warning/50 hover:bg-warning/5 transition-colors"
          >
            <div className="font-medium text-warning text-sm">⚠️ 明碼匯出</div>
            <p className="text-xs text-vault-text-tertiary mt-1">
              匯出未加密的資料，所有密碼將以明碼顯示
            </p>
          </button>
        ) : (
          <div className="p-4 rounded-lg border border-danger/50 bg-danger/5 space-y-3">
            <p className="text-sm text-danger font-medium">
              ⚠️ 警告：明碼匯出的檔案包含所有密碼原文，請妥善保管！
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePlaintextExport('json')}
                className="flex-1 py-2 text-sm rounded-lg bg-warning text-white hover:opacity-90"
              >
                JSON 格式
              </button>
              <button
                onClick={() => handlePlaintextExport('csv')}
                className="flex-1 py-2 text-sm rounded-lg bg-warning text-white hover:opacity-90"
              >
                CSV 格式
              </button>
            </div>
            <button
              onClick={() => setConfirmPlaintext(false)}
              className="w-full text-xs text-vault-text-tertiary hover:text-vault-text-secondary"
            >
              取消
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 text-sm text-vault-text-secondary hover:text-vault-text"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
