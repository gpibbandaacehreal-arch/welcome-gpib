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
    
    // DEBUG: Lihat semua nama field yang tersedia di PDF
    const fields = form.getFields();
    console.log('Daftar field yang ditemukan di PDF:', fields.map(f => f.getName()));

    // 4. Fill the fields by their Bookmark names from Word
    const fillField = (name: string, value: string) => {
      try {
        const field = form.getTextField(name);
        field.setText(value);
        console.log(`Berhasil mengisi field "${name}" dengan: ${value}`);
      } catch (e) {
        console.warn(`Gagal mengisi field "${name}":`, e instanceof Error ? e.message : e);
      }
    };

    fillField('tanggal_surat', data.tanggalSurat);
    fillField('nomor_surat', data.nomorSurat);
    fillField('tujuan_surat', data.tujuanSurat);

    // Pastikan tampilan field diupdate sebelum di-flatten
    // form.updateFieldAppearances(); // Opsional jika font standar bermasalah
    
    // 5. Flatten the form to make the text part of the PDF
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
