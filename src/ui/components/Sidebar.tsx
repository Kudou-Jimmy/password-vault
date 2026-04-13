import { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getActiveEntries, getDeletedEntries } from '@/core/vault';

interface SidebarProps {
  currentView: string;
  currentFolder: string | null;
  currentTag: string | null;
  onViewChange: (view: string) => void;
  onFolderChange: (folder: string | null) => void;
  onTagChange: (tag: string | null) => void;
}

export default function Sidebar({
  currentView,
  currentFolder,
  currentTag,
  onViewChange,
  onFolderChange,
  onTagChange,
}: SidebarProps) {
  const { data, lock, addFolder, removeFolder } = useVault();
  const { theme, toggleTheme } = useTheme();
  const [newFolder, setNewFolder] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);

  if (!data) return null;

  const activeEntries = getActiveEntries(data);
  const deletedEntries = getDeletedEntries(data);
  const favoriteCount = activeEntries.filter((e) => e.favorite).length;

  const handleAddFolder = () => {
    if (newFolder.trim()) {
      addFolder(newFolder.trim());
      setNewFolder('');
      setShowNewFolder(false);
    }
  };

  const navItem = (
    label: string,
    view: string,
    count: number,
    icon: string,
    onClick?: () => void
  ) => {
    const isActive =
      currentView === view &&
      (view !== 'folder' || currentFolder === null) &&
      (view !== 'tag' || currentTag === null);
    return (
      <button
        key={view}
        onClick={onClick ?? (() => { onViewChange(view); onFolderChange(null); onTagChange(null); })}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-vault-text-secondary hover:bg-vault-bg-tertiary'
        }`}
      >
        <span>{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span className="text-xs text-vault-text-tertiary">{count}</span>
      </button>
    );
  };

  return (
    <div className="w-64 h-screen bg-vault-sidebar border-r border-vault-border flex flex-col overflow-hidden">
      <div className="p-4 border-b border-vault-border">
        <h1 className="text-lg font-bold text-vault-text flex items-center gap-2">
          🔐 密碼金庫
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItem('所有項目', 'all', activeEntries.length, '📋')}
        {navItem('我的最愛', 'favorites', favoriteCount, '⭐')}
        {navItem('回收桶', 'trash', deletedEntries.length, '🗑️')}

        <div className="pt-4 pb-1">
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-medium text-vault-text-tertiary uppercase tracking-wider">
              資料夾
            </span>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="text-vault-text-tertiary hover:text-primary text-lg leading-none"
            >
              +
            </button>
          </div>
        </div>

        {showNewFolder && (
          <div className="flex gap-1 px-1">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
              placeholder="資料夾名稱"
              className="flex-1 px-2 py-1 text-sm rounded border border-vault-border bg-vault-input text-vault-text focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleAddFolder}
              className="px-2 py-1 text-sm rounded bg-primary text-white hover:bg-primary-hover"
            >
              加
            </button>
          </div>
        )}

        {data.folders.map((folder) => {
          const count = activeEntries.filter((e) => e.folder === folder).length;
          const isActive = currentView === 'folder' && currentFolder === folder;
          return (
            <div key={folder} className="group flex items-center">
              <button
                onClick={() => {
                  onViewChange('folder');
                  onFolderChange(folder);
                  onTagChange(null);
                }}
                className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-vault-text-secondary hover:bg-vault-bg-tertiary'
                }`}
              >
                <span>📁</span>
                <span className="flex-1 text-left">{folder}</span>
                <span className="text-xs text-vault-text-tertiary">{count}</span>
              </button>
              {folder !== '預設' && (
                <button
                  onClick={() => removeFolder(folder)}
                  className="opacity-0 group-hover:opacity-100 px-1 text-vault-text-tertiary hover:text-danger text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {data.tags.length > 0 && (
          <>
            <div className="pt-4 pb-1">
              <span className="px-3 text-xs font-medium text-vault-text-tertiary uppercase tracking-wider">
                標籤
              </span>
            </div>
            {data.tags.map((tag) => {
              const count = activeEntries.filter((e) => e.tags.includes(tag)).length;
              const isActive = currentView === 'tag' && currentTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    onViewChange('tag');
                    onFolderChange(null);
                    onTagChange(tag);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-vault-text-secondary hover:bg-vault-bg-tertiary'
                  }`}
                >
                  <span>🏷️</span>
                  <span className="flex-1 text-left">{tag}</span>
                  <span className="text-xs text-vault-text-tertiary">{count}</span>
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-vault-border space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-vault-text-secondary hover:bg-vault-bg-tertiary transition-colors"
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? '淺色模式' : '深色模式'}</span>
        </button>
        <button
          onClick={lock}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
        >
          <span>🔒</span>
          <span>鎖定金庫</span>
        </button>
      </div>
    </div>
  );
}
