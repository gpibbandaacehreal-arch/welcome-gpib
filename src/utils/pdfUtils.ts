import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface ProposalData {
  nomorSurat: string;
  tujuanSurat: string;
  tanggalSurat: string;
}

export const generateProposalPDF = async (data: ProposalData): Promise<Uint8Array> => {
  console.log('Memulai generateProposalPDF dengan data:', data);
  try {
    // 1. Load cover.pdf and isi.pdf from public folder
    const coverUrl = '/COVER.pdf';
    const isiUrl = '/ISI.pdf';

    console.log('Fetching PDF files...');
    const [coverRes, isiRes] = await Promise.all([
      fetch(coverUrl),
      fetch(isiUrl)
    ]);

    if (!coverRes.ok) throw new Error(`Gagal mengambil COVER.pdf: ${coverRes.status} ${coverRes.statusText}`);
    if (!isiRes.ok) throw new Error(`Gagal mengambil ISI.pdf: ${isiRes.status} ${isiRes.statusText}`);

    const [coverBytes, isiBytes] = await Promise.all([
      coverRes.arrayBuffer(),
      isiRes.arrayBuffer()
    ]);
    console.log('File PDF berhasil dimuat ke memori.');

    // 2. Load the cover PDF document
    const coverDoc = await PDFDocument.load(coverBytes);
    console.log('Cover PDF berhasil di-load oleh pdf-lib.');
    coverDoc.registerFontkit(fontkit);

    // 3. Get the first page of cover
    const pages = coverDoc.getPages();
    const firstPage = pages[0];

    // 4. Set font (using standard font for simplicity, or we could load custom)
    const font = await coverDoc.embedFont(StandardFonts.HelveticaBold);

    // 5. Fill placeholders
    // Catatan: Karena pdf-lib tidak bisa mencari teks otomatis, kita menggunakan koordinat (x, y).
    // Anda bisa menyesuaikan angka x dan y di bawah ini agar pas dengan posisi {tag} di COVER.pdf Anda.
    // Tip: x: 0 adalah kiri, y: 0 adalah bawah halaman. A4 biasanya ~595x842 unit.

    // --- POSISI NOMOR SURAT ---
    firstPage.drawText(data.nomorSurat, {
      x: 180, // Geser horizontal
      y: 675, // Geser vertikal
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    // --- POSISI TUJUAN PROPOSAL ---
    // Jika tujuan sangat panjang, kita bisa memecahnya (opsional)
    firstPage.drawText(data.tujuanSurat, {
      x: 180,
      y: 645,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    // --- POSISI TANGGAL SURAT ---
    firstPage.drawText(data.tanggalSurat, {
      x: 440,
      y: 715,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });

    // 6. Load the ISI PDF document
    const isiDoc = await PDFDocument.load(isiBytes);

    // 7. Merge documents
    // We add all pages from isiDoc to coverDoc
    const isiPages = await coverDoc.copyPages(isiDoc, isiDoc.getPageIndices());
    isiPages.forEach((page) => coverDoc.addPage(page));

    // 8. Save the document
    const pdfBytes = await coverDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
