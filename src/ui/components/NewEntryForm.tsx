import { useState } from 'react';
import type { EntryType, VaultField } from '@/types';
import { DEFAULT_FIELDS } from '@/types';
import { useVault } from '@/contexts/VaultContext';
import PasswordGenerator from './PasswordGenerator';
import StrengthMeter from './StrengthMeter';

interface NewEntryFormProps {
  onClose: () => void;
  defaultFolder?: string;
}

export default function NewEntryForm({ onClose, defaultFolder }: NewEntryFormProps) {
  const { addEntry, data, addTag } = useVault();
  const [type, setType] = useState<EntryType>('login');
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState<VaultField[]>(
    DEFAULT_FIELDS.login.map((f) => ({ ...f }))
  );
  const [folder, setFolder] = useState(defaultFolder ?? '預設');
  const [tags, setTags] = useState('');
  const [showGenerator, setShowGenerator] = useState(false);

  const handleTypeChange = (newType: EntryType) => {
    setType(newType);
    setFields(DEFAULT_FIELDS[newType].map((f) => ({ ...f })));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    for (const tag of tagList) {
      await addTag(tag);
    }

    await addEntry(type, title.trim(), fields, folder, tagList);
    onClose();
  };

  const handleUseGenerated = (password: string) => {
    const pwIndex = fields.findIndex((f) => f.key === '密碼' || f.key === '使用者密碼');
    if (pwIndex >= 0) {
      handleFieldChange(pwIndex, password);
    }
    setShowGenerator(false);
  };

  const typeOptions: { value: EntryType; label: string; icon: string }[] = [
    { value: 'login', label: '登入', icon: '🔑' },
    { value: 'bank', label: '網路銀行', icon: '🏦' },
    { value: 'debit-card', label: '金融卡', icon: '🏧' },
    { value: 'card', label: '信用卡', icon: '💳' },
    { value: 'identity', label: '身份', icon: '👤' },
    { value: 'note', label: '筆記', icon: '📝' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-vault-bg">
      <div className="sticky top-0 bg-vault-bg border-b border-vault-border px-6 py-3 flex items-center justify-between z-10">
        <button onClick={onClose} className="text-vault-text-secondary hover:text-vault-text text-sm">
          ← 取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-4 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
        >
          儲存
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-2xl">
        <div className="flex gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                type === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-vault-border text-vault-text-secondary hover:bg-vault-bg-secondary'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="標題"
          className="w-full text-xl font-bold bg-transparent border-b border-vault-border text-vault-text placeholder-vault-text-tertiary focus:outline-none focus:border-primary pb-2"
          autoFocus
        />

        <div className="space-y-3">
          {fields.map((field, i) => (
            <div key={i} className="space-y-1">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    value={field.key}
                    onChange={(e) =>
                      setFields((prev) =>
                        prev.map((f, j) => (j === i ? { ...f, key: e.target.value } : f))
                      )
                    }
                    placeholder="欄位名稱"
                    className="w-full text-xs text-vault-text-secondary bg-transparent focus:outline-none"
                  />
                  <input
                    value={field.value}
                    onChange={(e) => handleFieldChange(i, e.target.value)}
                    type={field.sensitive ? 'password' : 'text'}
                    placeholder={`請輸入${field.key}`}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-vault-border bg-vault-input text-vault-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveField(i)}
                  className="text-vault-text-tertiary hover:text-danger text-sm mt-5"
                >
                  ✕
                </button>
              </div>
              {(field.key === '密碼' || field.key === '使用者密碼') && field.value && (
                <StrengthMeter password={field.value} />
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddField}
              className="text-sm text-primary hover:text-primary-hover"
            >
              + 新增欄位
            </button>
            {(type === 'login' || type === 'bank') && (
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-sm text-primary hover:text-primary-hover"
              >
                🎲 密碼產生器
              </button>
            )}
          </div>

          {showGenerator && (
            <div className="border border-vault-border rounded-lg p-4 bg-vault-bg-secondary">
              <PasswordGenerator onUse={handleUseGenerated} />
            </div>
          )}
        </div>

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
      </form>
    </div>
  );
}
