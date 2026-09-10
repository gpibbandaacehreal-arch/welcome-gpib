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
