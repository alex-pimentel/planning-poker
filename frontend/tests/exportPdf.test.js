import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportPdf } from '../src/utils/exportPdf';
import jsPDF from 'jspdf';

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

vi.mock('jspdf-autotable', () => ({
  applyPlugin: vi.fn(),
}));

function getDocInstance() {
  return jsPDF.mock.results[jsPDF.mock.results.length - 1]?.value;
}

describe('exportPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls save with the correct filename', () => {
    const tasks = [
      { id: '1', name: 'Login', final_score: '8', group_id: null },
      { id: '2', name: 'Dashboard', final_score: '5', group_id: null },
    ];

    exportPdf({ roomCode: 'ABCD12', userName: 'Alex', tasks, groups: [] });

    expect(getDocInstance().save).toHaveBeenCalledWith('planning-poker-ABCD12.pdf');
  });

  it('filters only scored tasks', () => {
    const tasks = [
      { id: '1', name: 'Login', final_score: '8', group_id: null },
      { id: '2', name: 'Pending', final_score: null, group_id: null },
    ];

    exportPdf({ roomCode: 'ABCD12', userName: 'Alex', tasks, groups: [] });

    const doc = getDocInstance();
    expect(doc.autoTable).toHaveBeenCalled();
    const callArgs = doc.autoTable.mock.calls[0][0];
    expect(callArgs.body).toHaveLength(1);
    expect(callArgs.body[0][1]).toBe('Login');
  });

  it('includes group name in task name when group_id matches', () => {
    const tasks = [
      { id: '1', name: 'Login', final_score: '8', group_id: 'g1' },
    ];
    const groups = [{ id: 'g1', name: 'Frontend' }];

    exportPdf({ roomCode: 'ABCD12', userName: 'Alex', tasks, groups });

    const callArgs = getDocInstance().autoTable.mock.calls[0][0];
    expect(callArgs.body[0][1]).toBe('Login (Frontend)');
  });

  it('does nothing when no scored tasks', () => {
    const tasks = [
      { id: '1', name: 'Login', final_score: null, group_id: null },
    ];

    exportPdf({ roomCode: 'ABCD12', userName: 'Alex', tasks, groups: [] });

    expect(jsPDF).not.toHaveBeenCalled();
  });

  it('treats empty final_score as unscored and does not generate PDF', () => {
    const tasks = [
      { id: '1', name: 'Deploy', final_score: '', group_id: null },
    ];

    exportPdf({ roomCode: 'ABCD12', userName: 'Alex', tasks, groups: [] });

    expect(jsPDF).not.toHaveBeenCalled();
  });

  it('renders score values correctly', () => {
    const tasks = [
      { id: '2', name: 'Login', final_score: '5', group_id: null },
    ];

    exportPdf({ roomCode: 'ABCD12', userName: 'Alex', tasks, groups: [] });

    const callArgs = getDocInstance().autoTable.mock.calls[0][0];
    expect(callArgs.body[0][2]).toBe('5');
  });
});
