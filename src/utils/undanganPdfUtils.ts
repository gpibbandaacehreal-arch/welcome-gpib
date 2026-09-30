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
 * Membuat PDF tabel Riwayat Undangan (A4 landscape, multi-halaman otomatis).
 * Baris yang tidak muat lagi di halaman saat ini dilanjutkan ke halaman baru
 * dengan header tabel diulang — pdf-lib di-import dinamis agar bundle ringan.
 */
export const generateRiwayatUndanganPDF = async (rows: UndanganRiwayatRow[]): Promise<Uint8Array> => {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  // A4 landscape: 842 x 595 pt
  const PAGE_W = 842;
  const PAGE_H = 595;
  const margin = 40;
  const headerH = 22;
  const dataRowH = 28;
  // Batas bawah area tabel: sisakan ruang footer (total + tanggal + nomor halaman)
  const bottomLimit = margin + 30;

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - margin;
  let pageNumber = 1;

  // Konfigurasi kolom: [label, lebar]
  const cols: Array<[string, number]> = [
    ['No', 40], ['Nama Undangan', 380], ['PIC', 200], ['Tanggal', 120],
  ];
  const colX: number[] = [];
  let acc = margin;
  cols.forEach(([, w]) => { colX.push(acc); acc += w; });
  const tableW = acc - margin;

  // ── Estimasi total halaman (untuk footer "Halaman X dari Y") ──
  // Halaman 1: judul memakan ~40pt. Halaman lanjutan: header tabel diulang.
  const rowsOnFirstPage = Math.floor((PAGE_H - margin - 40 - headerH - bottomLimit) / dataRowH);
  const rowsOnOtherPages = Math.floor((PAGE_H - margin - headerH - bottomLimit) / dataRowH);
  const totalPages = rows.length <= rowsOnFirstPage
    ? 1
    : 1 + Math.ceil((rows.length - rowsOnFirstPage) / rowsOnOtherPages);

  const drawFooter = (pageNum: number) => {
    page.drawText(`Total: ${rows.length} undangan | Dicetak: ${new Date().toLocaleString('id-ID')}`, {
      x: margin, y: margin - 12, size: 8, font, color: rgb(0.45, 0.45, 0.45),
    });
    if (totalPages > 1) {
      page.drawText(`Halaman ${pageNum} dari ${totalPages}`, {
        x: PAGE_W - margin - 90, y: margin - 12, size: 8, font, color: rgb(0.45, 0.45, 0.45),
      });
    }
  };

  const drawHeaderRow = () => drawRow(cols.map(([label]) => label), true, true);

  const drawRow = (cells: string[], bold = false, isHeader = false) => {
    const f = bold ? fontBold : font;
    const size = isHeader ? 10 : 9;
    const rowH = isHeader ? headerH : dataRowH;

    // Pindah halaman bila baris ini tidak muat lagi di halaman saat ini
    if (y - rowH < bottomLimit) {
      drawFooter(pageNumber);
      page = doc.addPage([PAGE_W, PAGE_H]);
      pageNumber += 1;
      y = PAGE_H - margin;
      drawHeaderRow();
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

  // Judul (hanya halaman pertama)
  page.drawText('Riwayat Undangan — GPIB Banda Aceh', {
    x: margin, y: y - 14, size: 16, font: fontBold, color: rgb(0.1, 0.1, 0.1),
  });
  y -= 40;

  drawHeaderRow();
  rows.forEach(r => {
    drawRow([String(r.no), r.nama_undangan, r.pic || '-', r.tanggal_undangan || '-']);
  });

  // Footer halaman terakhir
  drawFooter(pageNumber);

  return doc.save();
};
