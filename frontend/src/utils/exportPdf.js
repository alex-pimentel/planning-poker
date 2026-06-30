import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

applyPlugin(jsPDF);

export function exportPdf({ roomCode, userName, tasks, groups }) {
  const scored = tasks.filter((t) => t.final_score);
  if (scored.length === 0) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text('Planning Poker', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Room: ${roomCode}`, 14, 32);
  doc.text(`Exported by: ${userName}`, 14, 39);
  doc.text(
    `Date: ${new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    14,
    46,
  );

  doc.setDrawColor(100, 100, 100);
  doc.line(14, 50, pageWidth - 14, 50);

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
    head: [['#', 'Task', 'Score']],
    body: rows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(9);
  doc.text(`Total: ${scored.length} task${scored.length !== 1 ? 's' : ''}`, 14, finalY);

  doc.save(`planning-poker-${roomCode}.pdf`);
}
