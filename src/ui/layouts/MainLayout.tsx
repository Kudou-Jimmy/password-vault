import { useState, useMemo } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { getActiveEntries, getDeletedEntries } from '@/core/vault';
import Sidebar from '@/ui/components/Sidebar';
import EntryList from '@/ui/components/EntryList';
import EntryDetail from '@/ui/components/EntryDetail';
import NewEntryForm from '@/ui/components/NewEntryForm';
import ExportDialog from '@/ui/components/ExportDialog';
import HealthReport from '@/ui/components/HealthReport';

export default function MainLayout() {
  const { data } = useVault();
  const [currentView, setCurrentView] = useState('all');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  if (!data) return null;

  const activeEntries = getActiveEntries(data);
  const deletedEntries = getDeletedEntries(data);
  const isTrash = currentView === 'trash';

  const filteredEntries = useMemo(() => {
    let entries = isTrash ? deletedEntries : activeEntries;

    if (currentView === 'favorites') {
      entries = entries.filter((e) => e.favorite);
    } else if (currentView === 'folder' && currentFolder) {
      entries = entries.filter((e) => e.folder === currentFolder);
    } else if (currentView === 'tag' && currentTag) {
      entries = entries.filter((e) => e.tags.includes(currentTag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.fields.some(
            (f) =>
              !f.sensitive &&
              (f.key.toLowerCase().includes(q) || f.value.toLowerCase().includes(q))
          ) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return entries.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [activeEntries, deletedEntries, currentView, currentFolder, currentTag, searchQuery, isTrash]);

  const selectedEntry = data.entries.find((e) => e.id === selectedId) ?? null;

  const viewTitle =
    currentView === 'all' ? '所有項目'
    : currentView === 'favorites' ? '我的最愛'
    : currentView === 'trash' ? '回收桶'
    : currentView === 'folder' ? `📁 ${currentFolder}`
    : currentView === 'tag' ? `🏷️ ${currentTag}`
    : '所有項目';

  return (
    <div className="h-screen flex bg-vault-bg overflow-hidden">
      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowMobileSidebar(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative z-50 md:z-auto transition-transform md:translate-x-0 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          currentView={currentView}
          currentFolder={currentFolder}
          currentTag={currentTag}
          onViewChange={(v) => { setCurrentView(v); setSelectedId(null); setShowNewEntry(false); setShowMobileSidebar(false); }}
          onFolderChange={(f) => { setCurrentFolder(f); setSelectedId(null); setShowMobileSidebar(false); }}
          onTagChange={(t) => { setCurrentTag(t); setSelectedId(null); setShowMobileSidebar(false); }}
        />
      </div>

      {/* Entry list panel */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-vault-border flex flex-col bg-vault-bg ${selectedEntry || showNewEntry ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-3 border-b border-vault-border space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="md:hidden text-vault-text-secondary p-1"
            >
              ☰
            </button>
            <h2 className="flex-1 text-sm font-semibold text-vault-text">{viewTitle}</h2>
            <button
              onClick={() => setShowHealth(true)}
              className="text-vault-text-tertiary hover:text-vault-text text-sm"
              title="健康報告"
            >
              📊
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="text-vault-text-tertiary hover:text-vault-text text-sm"
              title="匯出"
            >
              📤
            </button>
            {!isTrash && (
              <button
                onClick={() => { setShowNewEntry(true); setSelectedId(null); }}
                className="px-3 py-1 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover"
              >
                + 新增
              </button>
            )}
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-vault-border bg-vault-input text-vault-text placeholder-vault-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <EntryList
          entries={filteredEntries}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setShowNewEntry(false); }}
          isTrash={isTrash}
        />
      </div>

      {/* Detail panel */}
      {showNewEntry ? (
        <NewEntryForm
          onClose={() => setShowNewEntry(false)}
          defaultFolder={currentView === 'folder' ? currentFolder ?? undefined : undefined}
        />
      ) : selectedEntry ? (
        <EntryDetail
          key={selectedEntry.id + selectedEntry.updatedAt}
          entry={selectedEntry}
          onClose={() => setSelectedId(null)}
          isTrash={isTrash}
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-vault-text-tertiary">
          <div className="text-center">
            <div className="text-5xl mb-4">🔐</div>
            <p>選擇一個項目查看詳情</p>
          </div>
        </div>
      )}

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
      {showHealth && <HealthReport onClose={() => setShowHealth(false)} />}
    </div>
  );
}
