// ═══════════════════════════════════════════════════════════════
// EXPORT TABEL RIWAYAT PROPOSAL (.pdf)
// ═══════════════════════════════════════════════════════════════

export interface ProposalRiwayatRow {
  no: number;
  nomor_surat: string;
  tujuan_surat: string;
  pemohon: string;
  tanggal_surat: string;
}

/**
 * Membuat PDF rekap tabel Riwayat Proposal (A4 landscape, multi-page otomatis).
 * pdf-lib (~300 KB) di-import secara dinamis — hanya dimuat saat pengguna
 * menekan tombol "Simpan PDF", sehingga bundle awal situs tetap ringan.
 */
export const generateRiwayatProposalPDF = async (rows: ProposalRiwayatRow[]): Promise<Uint8Array> => {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  // A4 landscape: 842 x 595 pt
  const pageW = 842;
  const pageH = 595;
  let page = doc.addPage([pageW, pageH]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const topY = pageH - margin;
  const bottomY = margin + 20;
  let y = topY;

  const title = 'Rekap Proposal — GPIB Banda Aceh';
  const titleSize = 16;
  page.drawText(title, {
    x: margin,
    y: y - titleSize,
    size: titleSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= titleSize + 20;

  // Konfigurasi kolom: [label, lebar] — total = 762, pas di A4 landscape
  const cols: Array<[string, number]> = [
    ['No', 36],
    ['Nomor Surat', 130],
    ['Tujuan Surat', 346],
    ['Pemohon', 130],
    ['Tanggal', 120],
  ];
  const colX: number[] = [];
  let acc = margin;
  cols.forEach(([, w]) => { colX.push(acc); acc += w; });
  const tableW = acc - margin;

  /** Bungkus teks per kata (maks lebar kolom); dukung \n untuk multi-baris. */
  const wrapText = (text: string, size: number, colW: number): string[] => {
    const maxChars = Math.floor((colW - 10) / (size * 0.5));
    const lines: string[] = [];
    for (const segment of text.split('\n')) {
      let line = '';
      for (const word of segment.split(' ')) {
        const cand = line ? line + ' ' + word : word;
        if (cand.length <= maxChars) { line = cand; }
        else { if (line) lines.push(line); line = word; }
      }
      lines.push(line);
    }
    return lines;
  };

  const drawRow = (cells: string[], bold = false, isHeader = false) => {
    const f = bold ? fontBold : font;
    const size = isHeader ? 10 : 9;
    const lh = size + 2;

    // Hitung tinggi baris dari baris teks terbanyak (maks 4 baris per sel)
    let maxLines = 1;
    cells.forEach((text, i) => {
      maxLines = Math.max(maxLines, Math.min(4, wrapText(text, size, cols[i][1]).length));
    });
    const rowH = isHeader ? 22 : Math.max(24, maxLines * lh + 8);

    // Ganti halaman bila baris melewati batas bawah
    if (y - rowH < bottomY) {
      page = doc.addPage([pageW, pageH]);
      y = topY;
      if (!isHeader) {
        // Ulangi header tabel di halaman baru agar tetap mudah dibaca
        drawHeader();
      }
    }

    // Latar header
    if (isHeader) {
      page.drawRectangle({ x: margin, y: y - rowH + 6, width: tableW, height: rowH, color: rgb(0.9, 0.92, 0.9) });
    }
    // Border tiap sel
    let x = margin;
    cols.forEach(([, w]) => {
      page.drawRectangle({ x, y: y - rowH + 6, width: w, height: rowH, borderColor: rgb(0.75, 0.75, 0.75), borderWidth: 0.5 });
      x += w;
    });
    // Teks sel
    cells.forEach((text, i) => {
      const [, w] = cols[i];
      const lines = wrapText(text, size, w);
      const startY = y - rowH / 2 + (lines.length * lh) / 2;
      lines.slice(0, 4).forEach((ln, li) => {
        page.drawText(ln, {
          x: colX[i] + 5,
          y: startY - li * lh - size * 0.3,
          size,
          font: f,
          color: rgb(0.15, 0.15, 0.15),
        });
      });
    });
    y -= rowH;
  };

  const drawHeader = () => {
    drawRow(cols.map(([label]) => label), true, true);
  };

  drawHeader();
  rows.forEach(r => {
    drawRow([String(r.no), r.nomor_surat, r.tujuan_surat, r.pemohon || '-', r.tanggal_surat || '-']);
  });

  // Footer: jumlah baris + tanggal cetak
  page.drawText(`Total: ${rows.length} proposal | Dicetak: ${new Date().toLocaleString('id-ID')}`, {
    x: margin,
    y: bottomY - 14,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
};
