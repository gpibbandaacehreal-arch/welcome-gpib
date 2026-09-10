export interface UndanganData {
  /** Nama undangan, bisa 2 baris dipisah '\n' (dicetak ke kotak "Kepada Yth.") */
  namaUndangan: string;
}

/**
 * Mengisi field form "nama undangan" pada template undangan
 * (public/undangan gpib 30 tahun.pdf) lalu flatten agar hasil
 * tampil di semua pembaca PDF.
 *
 * pdf-lib (~300 KB) di-import secara dinamis — hanya dimuat saat
 * pengguna benar-benar menekan tombol generate, sehingga bundle
 * awal situs tetap ringan.
 */
export const generateUndanganPDF = async (data: UndanganData): Promise<Uint8Array> => {
  const { PDFDocument } = await import('pdf-lib');

  // Template hanya ~380 KB; fetch saat dibutuhkan saja (browser biasanya
  // sudah menyimpannya di cache HTTP setelah unduhan pertama).
  // Nama file tanpa spasi agar URL aman & header cache vercel.json match.
  const res = await fetch('/undangan-gpib-30-tahun.pdf');
  if (!res.ok) {
    throw new Error(`Gagal mengambil template undangan: ${res.status} ${res.statusText}`);
  }
  const templateBytes = await res.arrayBuffer();

  const doc = await PDFDocument.load(templateBytes, { updateMetadata: false });
  const form = doc.getForm();

  let field;
  try {
    field = form.getTextField('nama undangan');
  } catch {
    throw new Error('Field "nama undangan" tidak ditemukan pada template PDF.');
  }

  // Field sudah multiline secara bawaan; aktifkan lagi hanya sebagai jaga-jaga
  // agar nama 1-2 baris selalu muat di kotak "Kepada Yth.".
  field.enableMultiline();
  field.setText(data.namaUndangan);

  try {
    form.updateFieldAppearances();
  } catch {
    // Beberapa template tetap ter-render baik tanpa updateFieldAppearances.
  }
  form.flatten();

  return doc.save();
};

// ═══════════════════════════════════════════════════════════════
// EXPORT TABEL RIWAYAT UNDANGAN (.pdf)
// ═══════════════════════════════════════════════════════════════

export interface UndanganRiwayatRow {
  no: number;
  nama_undangan: string;
  pic: string;
  tanggal_undangan: string;
}

/**
 * Membuat PDF tabel Riwayat Undangan (A4 landscape agar muat).
 * pdf-lib di-import dinamis — ringan, hanya dimuat saat tombol ditekan.
 */
export const generateRiwayatUndanganPDF = async (rows: UndanganRiwayatRow[]): Promise<Uint8Array> => {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  // A4 landscape: 842 x 595 pt
  const page = doc.addPage([842, 595]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  let y = 595 - margin;

  // Judul
  page.drawText('Riwayat Undangan — GPIB Banda Aceh', {
    x: margin, y: y - 14, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1),
  });
  y -= 40;

  // Konfigurasi kolom: [label, lebar]
  const cols: Array<[string, number]> = [
    ['No', 40], ['Nama Undangan', 380], ['PIC', 200], ['Tanggal', 120],
  ];
  const colX: number[] = [];
  let acc = margin;
  cols.forEach(([, w]) => { colX.push(acc); acc += w; });
  const tableW = acc - margin;

  const drawRow = (cells: string[], bold = false, isHeader = false) => {
    const f = bold ? fontBold : font;
    const size = isHeader ? 10 : 9;
    const rowH = isHeader ? 22 : 28;
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
      const maxChars = Math.floor((w - 10) / (size * 0.5));
      const lines: string[] = [];
      // Bungkus teks per kata; dukung \n untuk nama 2 baris
      for (const segment of text.split('\n')) {
        let line = '';
        for (const word of segment.split(' ')) {
          const cand = line ? line + ' ' + word : word;
          if (cand.length <= maxChars) { line = cand; }
          else { if (line) lines.push(line); line = word; }
        }
        lines.push(line);
      }
      const lh = size + 2;
      const startY = y - rowH / 2 + (lines.length * lh) / 2;
      lines.slice(0, 3).forEach((ln, li) => {
        page.drawText(ln.slice(0, maxChars), {
          x: colX[i] + 5, y: startY - li * lh - size * 0.3, size, font: f, color: rgb(0.15, 0.15, 0.15),
        });
      });
      x += w;
    });
    y -= rowH;
  };

  drawRow(cols.map(([label]) => label), true, true);
  rows.forEach(r => {
    drawRow([String(r.no), r.nama_undangan, r.pic || '-', r.tanggal_undangan || '-']);
  });

  // Footer: jumlah baris + tanggal cetak
  page.drawText(`Total: ${rows.length} undangan | Dicetak: ${new Date().toLocaleString('id-ID')}`, {
    x: margin, y: y - 16, size: 8, font, color: rgb(0.45, 0.45, 0.45),
  });

  return doc.save();
};
