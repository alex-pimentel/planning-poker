# Export Scored Tasks as PDF

**Date:** 2026-06-30
**Status:** Approved

## Overview

Allow any participant to export all scored tasks (tasks with `final_score`) as a PDF file at the end of a planning session. The PDF is generated entirely client-side and downloaded immediately.

## Data Source

From Zustand store (`useGameStore`):

| Data | Store Path | Purpose |
|---|---|---|
| `roomInfo.room_code` | `s.roomInfo.room_code` | Sala identifier |
| `userName` | `s.userName` | Current user's name (used as exporter name) |
| `tasks` | `s.tasks` | Filtered to `t.final_score` truthy for scored tasks |
| `groups` | `s.groups` | Resolve `task.group_id` to group name |
| `roomInfo.current_task` | `s.roomInfo.current_task` | Current task context (not critical but available) |

## PDF Layout

```
┌─────────────────────────────────────────────┐
│  Planning Poker                              │
│                                              │
│  Sala: ABCD12                                │
│  Exportado por: João                         │
│  Data: 30/06/2026 14:30                      │
│  ─────────────────────────────────────────── │
│                                              │
│  Tarefas Pontuadas (5)                       │
│                                              │
│  ┌────┬────────────────────────┬──────────┐  │
│  │  # │ Tarefa                 │ Pontuação│  │
│  ├────┼────────────────────────┼──────────┤  │
│  │  1 │ Login                  │    8     │  │
│  │  2 │ Dashboard              │    5     │  │
│  │  3 │ API (Grupo A)          │    3     │  │
│  │  4 │ Testes unitários       │    13    │  │
│  │  5 │ Deploy                 │    —     │  │
│  └────┴────────────────────────┴──────────┘  │
│                                              │
│  ─────────────────────────────────────────── │
│  Total: 5 tarefas                            │
└─────────────────────────────────────────────┘
```

### Columns
1. **#** — sequential number (1-based)
2. **Tarefa** — task name; if task has a group, append `(Group Name)` suffix
3. **Pontuação** — `final_score` value or `—` (em dash) if empty

### Header
- "Planning Poker" title
- Room code (`Sala: ABCD12`)
- Exporter name (`Exportado por: João`)
- Export date/time in Brazilian locale

### Footer
- Total count of exported tasks

## UI Placement

A single button **"Exportar PDF"** in the `TaskListPanel` header, immediately after the task count badge, before the Show/Hide toggle.

## Visibility & States

| Condition | Behavior |
|---|---|
| No tasks OR no scored tasks (`tasks.filter(t => t.final_score).length === 0`) | Button **hidden** |
| 1+ scored tasks | Button **visible**, clickable |
| Generating PDF | Button **disabled** with "Gerando..." text |

## Technical Approach

**Library:** `jspdf` + `jspdf-autotable`

Chosen for:
- Lightweight (~220KB combined)
- Direct programmatic PDF generation (no DOM dependency)
- `autotable` handles table layout, styling, auto-width — ideal for our tabular data
- Works in all modern browsers

### New File

`frontend/src/utils/exportPdf.js`

Pure function:

```js
export function exportPdf({ roomCode, userName, tasks, groups }) {
  // 1. Filter scored tasks
  // 2. Build header info
  // 3. Create jsPDF document
  // 4. Add title + metadata lines
  // 5. Use autotable for the task table
  // 6. Add footer
  // 7. Trigger save/download
}
```

### Integration

- Import `exportPdf` in `TaskListPanel.jsx`
- Call it from an `onClick` handler that reads from the Zustand store
- Lock the button during generation (set a local `exporting` state)

### Dependencies to Add

```json
{
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4"
}
```

## Non-Goals

- No server-side or Edge Function PDF generation
- No email or share functionality (download only)
- No CSV/JSON/XLSX export formats
- No PDF preview before download
- No styling customization by the user
