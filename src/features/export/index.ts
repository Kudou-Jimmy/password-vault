import type { VaultData, VaultEntry, EntryType } from '@/types';
import { getActiveEntries } from '@/core/vault';

const TYPE_LABELS: Record<EntryType, string> = {
  login: '登入帳號',
  bank: '網路銀行',
  'debit-card': '金融卡',
  card: '信用卡',
  identity: '身份資料',
  note: '筆記',
};

const TYPE_ICONS: Record<EntryType, string> = {
  login: '🔑',
  bank: '🏦',
  'debit-card': '🏧',
  card: '💳',
  identity: '👤',
  note: '📝',
};

const TYPE_ORDER: EntryType[] = ['login', 'bank', 'debit-card', 'card', 'identity', 'note'];

export interface GroupedEntries {
  type: EntryType;
  label: string;
  icon: string;
  entries: VaultEntry[];
  allFieldKeys: string[];
}

export function groupEntriesByType(vault: VaultData): GroupedEntries[] {
  const active = getActiveEntries(vault);
  const groups: GroupedEntries[] = [];

  for (const type of TYPE_ORDER) {
    const entries = active.filter((e) => e.type === type);
    if (entries.length === 0) continue;

    const fieldKeySet = new Set<string>();
    for (const entry of entries) {
      for (const field of entry.fields) {
        fieldKeySet.add(field.key);
      }
    }

    groups.push({
      type,
      label: TYPE_LABELS[type],
      icon: TYPE_ICONS[type],
      entries,
      allFieldKeys: Array.from(fieldKeySet),
    });
  }

  return groups;
}

function getFieldValue(entry: VaultEntry, key: string): string {
  return entry.fields.find((f) => f.key === key)?.value ?? '';
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function exportTimestamp(): string {
  return formatDate(Date.now());
}

// === Markdown ===

export function exportMarkdown(vault: VaultData): string {
  const groups = groupEntriesByType(vault);
  const lines: string[] = [
    '# 密碼金庫匯出',
    '',
    `匯出時間：${exportTimestamp()}`,
    '',
    '> ⚠️ 此檔案包含所有密碼明碼，請妥善保管！',
    '',
  ];

  for (const group of groups) {
    lines.push('---', '');
    lines.push(`## ${group.icon} ${group.label}（${group.entries.length} 筆）`);
    lines.push('');

    for (const entry of group.entries) {
      lines.push(`### ${entry.title}`);
      lines.push('');

      for (const field of entry.fields) {
        const value = field.value || '—';
        lines.push(`- **${field.key}**：${value}`);
      }

      const meta: string[] = [];
      if (entry.folder && entry.folder !== '預設') meta.push(`資料夾：${entry.folder}`);
      if (entry.tags.length > 0) meta.push(`標籤：${entry.tags.join(', ')}`);
      if (meta.length > 0) {
        lines.push(`- ${meta.join(' ｜ ')}`);
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}

// === JSON (grouped) ===

export function exportGroupedJSON(vault: VaultData): string {
  const groups = groupEntriesByType(vault);
  const result: Record<string, unknown> = {
    匯出時間: exportTimestamp(),
  };

  for (const group of groups) {
    result[group.label] = group.entries.map((entry) => {
      const obj: Record<string, string> = { 標題: entry.title };
      for (const key of group.allFieldKeys) {
        obj[key] = getFieldValue(entry, key);
      }
      if (entry.folder && entry.folder !== '預設') obj['資料夾'] = entry.folder;
      if (entry.tags.length > 0) obj['標籤'] = entry.tags.join(', ');
      return obj;
    });
  }

  return JSON.stringify(result, null, 2);
}

// === CSV (grouped) ===

export function exportGroupedCSV(vault: VaultData): string {
  const groups = groupEntriesByType(vault);
  const sections: string[] = [];

  for (const group of groups) {
    const headers = ['標題', ...group.allFieldKeys, '資料夾', '標籤'];
    const headerLine = headers.map((h) => csvEscape(h)).join(',');

    const rows = group.entries.map((entry) => {
      const values = [
        entry.title,
        ...group.allFieldKeys.map((key) => getFieldValue(entry, key)),
        entry.folder,
        entry.tags.join('; '),
      ];
      return values.map((v) => csvEscape(v)).join(',');
    });

    sections.push(
      `# ${group.icon} ${group.label}（${group.entries.length} 筆）`,
      headerLine,
      ...rows,
      ''
    );
  }

  return sections.join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// === Excel ===

export async function exportExcel(vault: VaultData): Promise<Blob> {
  const XLSX = await import('xlsx');
  const groups = groupEntriesByType(vault);
  const wb = XLSX.utils.book_new();

  for (const group of groups) {
    const headers = ['標題', ...group.allFieldKeys, '資料夾', '標籤'];
    const data = group.entries.map((entry) => [
      entry.title,
      ...group.allFieldKeys.map((key) => getFieldValue(entry, key)),
      entry.folder,
      entry.tags.join(', '),
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // Auto-adjust column widths
    const colWidths = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...data.map((row) => (row[i] ?? '').toString().length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
    });
    ws['!cols'] = colWidths;

    const sheetName = `${group.icon} ${group.label}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// === Word ===

export async function exportWord(vault: VaultData): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } = await import('docx');
  const groups = groupEntriesByType(vault);

  const children: (typeof Paragraph.prototype | typeof Table.prototype)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: '密碼金庫匯出', bold: true, size: 36 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `匯出時間：${exportTimestamp()}`, size: 20, color: '666666' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: '⚠️ 此檔案包含所有密碼明碼，請妥善保管！', size: 20, color: 'CC0000', bold: true })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  for (const group of groups) {
    // Section heading
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${group.icon} ${group.label}（${group.entries.length} 筆）`, bold: true, size: 28 })],
        spacing: { before: 400, after: 200 },
      })
    );

    // Table for this group
    const headerCells = ['標題', ...group.allFieldKeys].map(
      (text) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 18 })] })],
          shading: { fill: 'E8E8E8' },
        })
    );

    const dataRows = group.entries.map(
      (entry) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: entry.title, size: 18 })] })],
            }),
            ...group.allFieldKeys.map(
              (key) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: getFieldValue(entry, key) || '—', size: 18 })] })],
                })
            ),
          ],
        })
    );

    const table = new Table({
      rows: [new TableRow({ children: headerCells }), ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      },
    });

    children.push(table);
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBlob(doc);
}
