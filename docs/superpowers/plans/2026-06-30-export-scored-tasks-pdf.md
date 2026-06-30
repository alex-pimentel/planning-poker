# Export Scored Tasks as PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a button to the TaskListPanel that exports all scored tasks (tasks with `final_score`) as a downloadable PDF.

**Architecture:** Client-side PDF generation using `jspdf` + `jspdf-autotable`. A pure utility function filters scored tasks from the Zustand store, builds a document with room metadata + task table, and triggers download.

**Tech Stack:** React 19, Zustand 5, jsPDF 2.5+, jspdf-autotable 3.8+, Vitest

## Global Constraints

- Button only visible when at least 1 task has `final_score` set
- Portuguese labels: "Exportar PDF", "Gerando...", "Tarefas Pontuadas", "Sala", "Exportado por", "Data"
- PDF filename: `planning-poker-{roomCode}.pdf`
- No new environment variables, config files, or CI changes

---

### Task 0: Create branch

- [ ] **Create and switch to new branch**

```bash
git checkout -b feature/export-scored-tasks-pdf
```

---

### Task 1: Install dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Install jsPDF and jspdf-autotable**

```bash
npm install jspdf jspdf-autotable
```

- [ ] **Verify they installed**

```bash
node -e "const jspdf = require('jspdf'); console.log('jsPDF loaded');" 2>&1 || echo "Need .mjs check"
# In ESM context:
node --input-type=module -e "import jsPDF from 'jspdf'; console.log('jsPDF loaded')"
```

- [ ] **Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: add jspdf and jspdf-autotable dependencies"
```

---

### Task 2: Create exportPdf utility

**Files:**
- Create: `frontend/src/utils/exportPdf.js`

**Interfaces:**
- Consumes: `tasks` (array of task objects with `{name, final_score, group_id}`), `roomCode` (string), `userName` (string), `groups` (array of `{id, name}`)
- Produces: `exportPdf({ roomCode, userName, tasks, groups })` — triggers PDF download, no return value

- [ ] **Create exportPdf.js**

```js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function exportPdf({ roomCode, userName, tasks, groups }) {
  const scored = tasks.filter((t) => t.final_score);
  if (scored.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.text('Planning Poker', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Sala: ${roomCode}`, 14, 32);
  doc.text(`Exportado por: ${userName}`, 14, 39);
  doc.text(
    `Data: ${new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    14,
    46,
  );

  // Separator
  doc.setDrawColor(100, 100, 100);
  doc.line(14, 50, pageWidth - 14, 50);

  // Table
  const rows = scored.map((t, i) => {
    const group = groups.find((g) => g.id === t.group_id);
    return [
      String(i + 1),
      group ? `${t.name} (${group.name})` : t.name,
      t.final_score || '—',
    ];
  });

  doc.autoTable({
    startY: 56,
    head: [['#', 'Tarefa', 'Pontuação']],
    body: rows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center' },
    },
    didDrawPage: () => {
      // Draw column header separator
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const total = scored.length;
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text(`Total: ${total} tarefa${total !== 1 ? 's' : ''}`, 14, finalY);

  // Save
  doc.save(`planning-poker-${roomCode}.pdf`);
}
```

- [ ] **Commit**

```bash
git add frontend/src/utils/exportPdf.js
git commit -m "feat: add exportPdf utility for generating scored tasks PDF"
```

---

### Task 3: Add Export button to TaskListPanel

**Files:**
- Modify: `frontend/src/components/ui/TaskListPanel.jsx`

- [ ] **Add import and button to TaskListPanel**

Add at the top of the file:
```js
import { exportPdf } from '../../utils/exportPdf';
```

Add after the `useState` lines (around line 22):
```js
const [exporting, setExporting] = useState(false);
```

- [ ] **Add userName to store access and add export button**

The component currently has:
```js
const { roomInfo } = useGameStore();
```

Change to:
```js
const { roomInfo, userName } = useGameStore();
```

Add `exporting` state after the existing `collapsed` state:
```js
const [exporting, setExporting] = useState(false);
```

Add the export button in the header section (after the tasks count span, before the Show/Hide button — around line 81):
```jsx
{tasks.some((t) => t.final_score) && (
  <button
    onClick={async () => {
      setExporting(true);
      await new Promise((r) => setTimeout(r, 50));
      exportPdf({
        roomCode: roomInfo.room_code,
        userName,
        tasks,
        groups,
      });
      setExporting(false);
    }}
    disabled={exporting}
    className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400
               hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-wait
               transition-colors shrink-0"
  >
    {exporting ? 'Gerando...' : 'Exportar PDF'}
  </button>
)}
```

- [ ] **Run lint to verify no issues**

```bash
npm run lint
```

- [ ] **Commit**

```bash
git add frontend/src/components/ui/TaskListPanel.jsx
git commit -m "feat: add Exportar PDF button to TaskListPanel"
```

---

### Task 4: Write unit test for exportPdf

**Files:**
- Create: `frontend/tests/exportPdf.test.js`

- [ ] **Write test file**

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jsPDF and jspdf-autotable
vi.mock('jspdf', () => {
  const mockDoc = {
    text: vi.fn().mockReturnThis(),
    setFontSize: vi.fn().mockReturnThis(),
    setTextColor: vi.fn().mockReturnThis(),
    setDrawColor: vi.fn().mockReturnThis(),
    line: vi.fn().mockReturnThis(),
    save: vi.fn(),
    autoTable: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    internal: {
      pageSize: { getWidth: () => 210, getHeight: () => 297 },
    },
    lastAutoTable: { finalY: 150 },
  };
  return { default: vi.fn(() => mockDoc) };
});

describe('exportPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls save with the correct filename', () => {
    const { exportPdf } = await import('../src/utils/exportPdf');

    const tasks = [
      { id: '1', name: 'Login', final_score: '8', group_id: null },
      { id: '2', name: 'Dashboard', final_score: '5', group_id: null },
    ];
    const groups = [];

    exportPdf({
      roomCode: 'ABCD12',
      userName: 'Alex',
      tasks,
      groups,
    });

    const { default: JsPDF } = await import('jspdf');
    const docInstance = JsPDF.mock.results[0].value;
    expect(docInstance.save).toHaveBeenCalledWith('planning-poker-ABCD12.pdf');
  });

  it('filters only scored tasks', () => {
    const { exportPdf } = await import('../src/utils/exportPdf');

    const tasks = [
      { id: '1', name: 'Login', final_score: '8', group_id: null },
      { id: '2', name: 'Pendent', final_score: null, group_id: null },
    ];
    const groups = [];

    exportPdf({
      roomCode: 'ABCD12',
      userName: 'Alex',
      tasks,
      groups,
    });

    const { default: JsPDF } = await import('jspdf');
    const docInstance = JsPDF.mock.results[0].value;
    // autoTable should be called with 1 scored task
    expect(docInstance.autoTable).toHaveBeenCalled();
    // The head + body: head has ['#', 'Tarefa', 'Pontuação'], body has 1 row
    const autoTableCall = docInstance.autoTable.mock.calls[0][0];
    expect(autoTableCall.body).toHaveLength(1);
    expect(autoTableCall.body[0][1]).toBe('Login');
  });

  it('includes group name in task name when group_id matches', () => {
    const { exportPdf } = await import('../src/utils/exportPdf');

    const tasks = [
      { id: '1', name: 'Login', final_score: '8', group_id: 'g1' },
    ];
    const groups = [{ id: 'g1', name: 'Frontend' }];

    exportPdf({
      roomCode: 'ABCD12',
      userName: 'Alex',
      tasks,
      groups,
    });

    const { default: JsPDF } = await import('jspdf');
    const docInstance = JsPDF.mock.results[0].value;
    const autoTableCall = docInstance.autoTable.mock.calls[0][0];
    expect(autoTableCall.body[0][1]).toBe('Login (Frontend)');
  });

  it('does nothing when no scored tasks', () => {
    const { exportPdf } = await import('../src/utils/exportPdf');

    const tasks = [
      { id: '1', name: 'Login', final_score: null, group_id: null },
    ];

    exportPdf({
      roomCode: 'ABCD12',
      userName: 'Alex',
      tasks,
      groups: [],
    });

    const { default: JsPDF } = await import('jspdf');
    expect(JsPDF).not.toHaveBeenCalled();
  });

  it('uses em dash for missing final_score', () => {
    const { exportPdf } = await import('../src/utils/exportPdf');

    const tasks = [
      { id: '1', name: 'Deploy', final_score: '', group_id: null },
    ];
    const groups = [];

    exportPdf({
      roomCode: 'ABCD12',
      userName: 'Alex',
      tasks,
      groups,
    });

    const { default: JsPDF } = await import('jspdf');
    const docInstance = JsPDF.mock.results[0].value;
    const autoTableCall = docInstance.autoTable.mock.calls[0][0];
    expect(autoTableCall.body[0][2]).toBe('—');
  });
});
```

Wait — the `await import()` inside tests with `vi.mock` at the top may cause issues. Let me adjust the test to use a cleaner pattern.

Actually, since `vi.mock` is hoisted, the mock is applied before any imports. So `await import()` during the test should use the mocked version. However, the cleaner approach in vitest is to import at the top:

```js
import { exportPdf } from '../src/utils/exportPdf';
```

But then `vi.mock` needs to be defined before the import, which it is (hoisted). Let me use the simpler approach:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportPdf } from '../src/utils/exportPdf';

vi.mock('jspdf', () => {
  const mockDoc = {
    text: vi.fn().mockReturnThis(),
    setFontSize: vi.fn().mockReturnThis(),
    setTextColor: vi.fn().mockReturnThis(),
    setDrawColor: vi.fn().mockReturnThis(),
    line: vi.fn().mockReturnThis(),
    save: vi.fn(),
    autoTable: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    internal: {
      pageSize: { getWidth: () => 210, getHeight: () => 297 },
    },
    lastAutoTable: { finalY: 150 },
  };
  return { default: vi.fn(() => mockDoc) };
});
```

- [ ] **Run tests to verify they pass**

```bash
npm run test:unit
```

Expected: All 5 tests pass.

- [ ] **Commit**

```bash
git add frontend/tests/exportPdf.test.js
git commit -m "test: add unit tests for exportPdf utility"
```

---

### Task 5: Final verification

- [ ] **Run full lint + test suite**

```bash
npm run lint && npm run test:unit
```

Expected: Lint passes, all unit tests pass.

- [ ] **Check git status**

```bash
git status
```

No uncommitted files.

---

## File Changes Summary

| Action | File |
|---|---|
| Modify | `frontend/package.json` |
| Create | `frontend/src/utils/exportPdf.js` |
| Modify | `frontend/src/components/ui/TaskListPanel.jsx` |
| Create | `frontend/tests/exportPdf.test.js` |
