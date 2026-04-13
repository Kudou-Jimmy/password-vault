import { useState } from 'react';
import type { VaultEntry, VaultField } from '@/types';
import { useVault } from '@/contexts/VaultContext';
import StrengthMeter from './StrengthMeter';
import PasswordGenerator from './PasswordGenerator';

interface EntryDetailProps {
  entry: VaultEntry;
  onClose: () => void;
  isTrash?: boolean;
}

export default function EntryDetail({ entry, onClose, isTrash }: EntryDetailProps) {
  const { updateEntry, deleteEntry, restoreEntry, permanentlyDeleteEntry } = useVault();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [fields, setFields] = useState<VaultField[]>(entry.fields.map((f) => ({ ...f })));
  const [tags, setTags] = useState(entry.tags.join(', '));
  const [folder, setFolder] = useState(entry.folder);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const { data } = useVault();

  const handleSave = async () => {
    await updateEntry(entry.id, {
      title,
      fields,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      folder,
    });
    setEditing(false);
  };

  const handleCopy = async (value: string, index: number) => {
    await navigator.clipboard.writeText(value);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
    setTimeout(() => navigator.clipboard.writeText(''), 30000);
  };

  const handleFieldChange = (index: number, value: string) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, value } : f)));
  };

  const handleAddField = () => {
    setFields((prev) => [...prev, { key: '', value: '', sensitive: false }]);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseGenerated = (password: string) => {
    const pwIndex = fields.findIndex((f) => f.key === '密碼');
    if (pwIndex >= 0) {
      handleFieldChange(pwIndex, password);
    }
    setShowGenerator(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-vault-bg">
      <div className="sticky top-0 bg-vault-bg border-b border-vault-border px-6 py-3 flex items-center justify-between z-10">
        <button onClick={onClose} className="text-vault-text-secondary hover:text-vault-text text-sm">
          ← 返回
        </button>
        <div className="flex gap-2">
          {isTrash ? (
            <>
              <button
                onClick={() => { restoreEntry(entry.id); onClose(); }}
                className="px-3 py-1.5 text-sm rounded-lg bg-success text-white hover:opacity-90"
              >
                恢復
              </button>
              <button
                onClick={() => { permanentlyDeleteEntry(entry.id); onClose(); }}
                className="px-3 py-1.5 text-sm rounded-lg bg-danger text-white hover:opacity-90"
              >
                永久刪除
              </button>
            </>
          ) : editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setFields(entry.fields.map((f) => ({ ...f }))); setTitle(entry.title); }}
                className="px-3 py-1.5 text-sm rounded-lg border border-vault-border text-vault-text-secondary hover:bg-vault-bg-secondary"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover"
              >
                儲存
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => updateEntry(entry.id, { favorite: !entry.favorite })}
                className="px-3 py-1.5 text-sm rounded-lg border border-vault-border text-vault-text-secondary hover:bg-vault-bg-secondary"
              >
                {entry.favorite ? '★ 取消最愛' : '☆ 加入最愛'}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover"
              >
                編輯
              </button>
              <button
                onClick={() => { deleteEntry(entry.id); onClose(); }}
                className="px-3 py-1.5 text-sm rounded-lg bg-danger text-white hover:opacity-90"
              >
                刪除
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-2xl">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold w-full bg-transparent border-b border-vault-border text-vault-text focus:outline-none focus:border-primary pb-1"
          />
        ) : (
          <h2 className="text-xl font-bold text-vault-text">{entry.title}</h2>
        )}

        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={i} className="space-y-1">
              {editing ? (
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <input
                      value={field.key}
                      onChange={(e) => setFields((prev) => prev.map((f, j) => j === i ? { ...f, key: e.target.value } : f))}
                      placeholder="欄位名稱"
                      className="w-full text-xs text-vault-text-secondary bg-transparent border-b border-vault-border focus:outline-none focus:border-primary"
                    />
                    <input
                      value={field.value}
                      onChange={(e) => handleFieldChange(i, e.target.value)}
                      type={field.sensitive ? 'password' : 'text'}
                      placeholder="值"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-vault-border bg-vault-input text-vault-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <label className="flex items-center gap-1 text-xs text-vault-text-tertiary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.sensitive}
                        onChange={() => setFields((prev) => prev.map((f, j) => j === i ? { ...f, sensitive: !f.sensitive } : f))}
                        className="accent-primary"
                      />
                      敏感欄位
                    </label>
                  </div>
                  <button
                    onClick={() => handleRemoveField(i)}
                    className="text-vault-text-tertiary hover:text-danger text-sm mt-5"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <label className="text-xs text-vault-text-tertiary">{field.key}</label>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-vault-text font-mono">
                      {field.sensitive
                        ? showPassword[i]
                          ? field.value
                          : '••••••••'
                        : field.value || '—'}
                    </span>
                    {field.sensitive && field.value && (
                      <button
                        onClick={() => setShowPassword((p) => ({ ...p, [i]: !p[i] }))}
                        className="text-xs text-vault-text-tertiary hover:text-vault-text-secondary"
                      >
                        {showPassword[i] ? '隱藏' : '顯示'}
                      </button>
                    )}
                    {field.value && (
                      <button
                        onClick={() => handleCopy(field.value, i)}
                        className="text-xs text-vault-text-tertiary hover:text-primary"
                      >
                        {copied === i ? '已複製 ✓' : '複製'}
                      </button>
                    )}
                  </div>
                  {field.key === '密碼' && field.value && (
                    <StrengthMeter password={field.value} />
                  )}
                </>
              )}
            </div>
          ))}

          {editing && (
            <div className="flex gap-2">
              <button
                onClick={handleAddField}
                className="text-sm text-primary hover:text-primary-hover"
              >
                + 新增欄位
              </button>
              {entry.type === 'login' && (
                <button
                  onClick={() => setShowGenerator(!showGenerator)}
                  className="text-sm text-primary hover:text-primary-hover"
                >
                  🎲 密碼產生器
                </button>
              )}
            </div>
          )}

          {showGenerator && editing && (
            <div className="border border-vault-border rounded-lg p-4 bg-vault-bg-secondary">
              <PasswordGenerator onUse={handleUseGenerated} />
            </div>
          )}
        </div>

        {editing && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-vault-text-tertiary">資料夾</label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-vault-border bg-vault-input text-vault-text focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {data?.folders.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-vault-text-tertiary">標籤（逗號分隔）</label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-vault-border bg-vault-input text-vault-text focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="工作, 社群"
              />
            </div>
          </div>
        )}

        {!editing && (
          <div className="text-xs text-vault-text-tertiary space-y-1">
            <p>資料夾: {entry.folder}</p>
            {entry.tags.length > 0 && <p>標籤: {entry.tags.join(', ')}</p>}
            <p>建立時間: {new Date(entry.createdAt).toLocaleString('zh-TW')}</p>
            <p>更新時間: {new Date(entry.updatedAt).toLocaleString('zh-TW')}</p>
          </div>
        )}

        {!editing && entry.history.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-primary hover:text-primary-hover"
            >
              {showHistory ? '隱藏' : '顯示'}歷史紀錄 ({entry.history.length})
            </button>
            {showHistory && (
              <div className="mt-2 space-y-2">
                {[...entry.history].reverse().map((record, i) => (
                  <div key={i} className="border border-vault-border rounded-lg p-3 bg-vault-bg-secondary">
                    <p className="text-xs text-vault-text-tertiary mb-2">
                      {new Date(record.timestamp).toLocaleString('zh-TW')}
                    </p>
                    {record.fields.map((f, j) => (
                      <div key={j} className="text-xs">
                        <span className="text-vault-text-tertiary">{f.key}: </span>
                        <span className="text-vault-text font-mono">
                          {f.sensitive ? '••••••••' : f.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
