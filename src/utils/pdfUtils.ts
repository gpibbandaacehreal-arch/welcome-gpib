import { PDFDocument } from 'pdf-lib';

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
    
    // 3. Get the form from the document
    const form = coverDoc.getForm();

    // 4. Fill the fields by their Bookmark names from Word
    try {
      // Mengisi field tanggal_surat
      const tanggalField = form.getTextField('tanggal_surat');
      tanggalField.setText(data.tanggalSurat);
    } catch (e) {
      console.warn('Field tanggal_surat tidak ditemukan di PDF Form, mencoba fallback koordinat...');
    }

    try {
      // Mengisi field nomor_surat
      const nomorField = form.getTextField('nomor_surat');
      nomorField.setText(data.nomorSurat);
    } catch (e) {
      console.warn('Field nomor_surat tidak ditemukan di PDF Form');
    }

    try {
      // Mengisi field tujuan_surat
      const tujuanField = form.getTextField('tujuan_surat');
      tujuanField.setText(data.tujuanSurat);
    } catch (e) {
      console.warn('Field tujuan_surat tidak ditemukan di PDF Form');
    }

    // 5. Flatten the form to make the text part of the PDF (tidak bisa diedit lagi oleh user)
    form.flatten();

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
