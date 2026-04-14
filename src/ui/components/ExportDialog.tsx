import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import {
  exportMarkdown,
  exportGroupedJSON,
  exportGroupedCSV,
  exportExcel,
  exportWord,
} from '@/features/export';

interface ExportDialogProps {
  onClose: () => void;
}

function downloadText(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  downloadBlob(blob, filename);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const { exportEncrypted, data } = useVault();
  const [confirmPlaintext, setConfirmPlaintext] = useState(false);
  const [exporting, setExporting] = useState(false);

  const ts = Date.now();

  const handleEncryptedExport = async () => {
    const raw = await exportEncrypted();
    if (raw) {
      downloadText(raw, `vault-${ts}.json`, 'application/json');
      onClose();
    }
  };

  const handleExport = async (format: 'md' | 'json' | 'csv' | 'xlsx' | 'docx') => {
    if (!data) return;
    setExporting(true);

    try {
      switch (format) {
        case 'md':
          downloadText(exportMarkdown(data), `vault-${ts}.md`, 'text/markdown');
          break;
        case 'json':
          downloadText(exportGroupedJSON(data), `vault-${ts}.json`, 'application/json');
          break;
        case 'csv':
          downloadText(exportGroupedCSV(data), `vault-${ts}.csv`, 'text/csv');
          break;
        case 'xlsx': {
          const blob = await exportExcel(data);
          downloadBlob(blob, `vault-${ts}.xlsx`);
          break;
        }
        case 'docx': {
          const blob = await exportWord(data);
          downloadBlob(blob, `vault-${ts}.docx`);
          break;
        }
      }
      onClose();
    } finally {
      setExporting(false);
    }
  };

  const formatButtons: { format: 'md' | 'json' | 'csv' | 'xlsx' | 'docx'; label: string; icon: string }[] = [
    { format: 'md', label: 'Markdown', icon: '📄' },
    { format: 'xlsx', label: 'Excel', icon: '📊' },
    { format: 'docx', label: 'Word', icon: '📝' },
    { format: 'csv', label: 'CSV', icon: '📋' },
    { format: 'json', label: 'JSON', icon: '{ }' },
  ];

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
            <p className="text-xs text-vault-text-tertiary">
              選擇匯出格式（資料按類型分組呈現）：
            </p>
            <div className="grid grid-cols-3 gap-2">
              {formatButtons.map(({ format, label, icon }) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  disabled={exporting}
                  className="py-2.5 text-sm rounded-lg bg-warning text-white hover:opacity-90 disabled:opacity-50 flex flex-col items-center gap-1"
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
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
