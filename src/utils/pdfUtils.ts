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
    const fontSize = 12;

    // 5. Fill placeholders
    // NOTE: In a real scenario, you'd need the exact coordinates (x, y). 
    // I'll use placeholders for now. Let's assume some coordinates or search for text.
    // For this task, I'll place them at common positions or the user might have specified.
    // Since coordinates aren't provided, I'll use some default ones that usually fit a header/title area.
    
    // Nomor Surat placeholder
    firstPage.drawText(data.nomorSurat, {
      x: 150, // Adjust based on cover.pdf layout
      y: 650, // Adjust based on cover.pdf layout
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Tujuan Surat placeholder
    firstPage.drawText(data.tujuanSurat, {
      x: 150, // Adjust based on cover.pdf layout
      y: 600, // Adjust based on cover.pdf layout
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });

    // Tanggal Surat placeholder
    firstPage.drawText(data.tanggalSurat, {
      x: 400, // Adjust based on cover.pdf layout
      y: 700, // Adjust based on cover.pdf layout
      size: fontSize,
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
