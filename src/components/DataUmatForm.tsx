import React, { useState, useCallback } from 'react';
import {
  type DataJemaat,
  DEFAULT_DATA_JEMAAT,
  GOLONGAN_DARAH_OPTIONS,
  STATUS_WARGA_OPTIONS,
  STATUS_PERKAWINAN_OPTIONS,
  SEKTOR_OPTIONS,
} from '../types/dataUmat';
import { validateFile, uploadDocument } from '../utils/documentUpload';
import { compressImageFile } from '../utils/imageUtils';

interface DataUmatFormProps {
  initialData?: DataJemaat;
  onSubmit: (data: DataJemaat) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

type UploadState = Record<string, boolean>;
type FormErrors = Record<string, string>;

const DataUmatForm: React.FC<DataUmatFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<DataJemaat>(() => {
    if (initialData) return { ...DEFAULT_DATA_JEMAAT, ...initialData };
    return { ...DEFAULT_DATA_JEMAAT, id: '' };
  });

  const [uploading, setUploading] = useState<UploadState>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback(
    (field: keyof DataJemaat, value: string) => {
      // No. Telepon: hanya terima angka
      if (field === 'no_telepon') {
        value = value.replace(/[^0-9]/g, '');
      }

      setFormData(prev => {
        const updated = { ...prev, [field]: value };
        // Auto-generate username from nama_lengkap (lowercase, no spaces)
        if (field === 'nama_lengkap') {
          updated.username_baru = value.toLowerCase().replace(/\s+/g, '');
        }
        return updated;
      });

      // Clear error when user types
      if (errors[field]) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleFileUpload = useCallback(
    async (field: keyof DataJemaat, file: File, kodeBerkas: string) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }

      setUploading(prev => ({ ...prev, [field]: true }));
      try {
        // Foto (JPG/PNG) dikompres dulu agar upload cepat & hemat storage;
        // PDF dan file non-gambar dilewatkan apa adanya oleh compressImageFile.
        const fileToUpload = await compressImageFile(file);
        const url = await uploadDocument(fileToUpload, formData.nama_lengkap || 'unknown', kodeBerkas);
        setFormData(prev => ({ ...prev, [field]: url }));
      } catch (error) {
        console.error('Upload gagal:', error);
        alert('Gagal mengunggah dokumen: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setUploading(prev => ({ ...prev, [field]: false }));
      }
    },
    [formData.nama_lengkap]
  );

  /**
   * Validasi seluruh form sebelum submit.
   * Mengembalikan object errors (kosong = valid).
   */
  const validateForm = (): FormErrors => {
    const errs: FormErrors = {};

    // ═══ WAJIB (MANDATORY) ═══
    if (!formData.nama_lengkap.trim()) {
      errs.nama_lengkap = 'Nama Lengkap wajib diisi.';
    }

    if (!formData.username_baru.trim()) {
      errs.username_baru = 'Username wajib diisi.';
    }

    if (!formData.no_telepon.trim()) {
      errs.no_telepon = 'No. Telepon wajib diisi.';
    } else if (!/^[0-9]+$/.test(formData.no_telepon)) {
      errs.no_telepon = 'No. Telepon hanya boleh berisi angka.';
    } else if (formData.no_telepon.length < 10) {
      errs.no_telepon = 'No. Telepon minimal 10 digit.';
    }

    if (!formData.status_warga) {
      errs.status_warga = 'Status Warga wajib dipilih.';
    }

    if (!formData.sektor_pelayanan) {
      errs.sektor_pelayanan = 'Sektor Pelayanan wajib dipilih.';
    }

    // ═══ KONDISIONAL: BERKAS MAJELIS ═══
    const isMajelisOrPresbiter = formData.status_warga === 'Presbiter' || formData.status_warga === 'Majelis';
    if (isMajelisOrPresbiter) {
      if (!formData.berkas_majelis_surat_kesediaan) {
        errs.berkas_majelis_surat_kesediaan = 'Surat Kesediaan wajib diunggah untuk status ' + formData.status_warga + '.';
      }
      if (!formData.berkas_majelis_surat_pilihan) {
        errs.berkas_majelis_surat_pilihan = 'Surat Pernyataan Pilihan wajib diunggah untuk status ' + formData.status_warga + '.';
      }
      if (!formData.berkas_majelis_surat_loyalitas) {
        errs.berkas_majelis_surat_loyalitas = 'Surat Pernyataan Loyalitas wajib diunggah untuk status ' + formData.status_warga + '.';
      }
    }

    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Tampilkan ringkasan error
      const errorMessages = Object.values(validationErrors).join('\n');
      alert('⚠️ Mohon lengkapi data berikut:\n\n' + errorMessages);
      return;
    }

    onSubmit(formData);
  };

  const isMajelisOrPresbiter = formData.status_warga === 'Presbiter' || formData.status_warga === 'Majelis';

  return (
    <form onSubmit={handleSubmit} className="data-umat-form" noValidate>
      {/* ═══════════════════════════════════════════════
          SECTION 1: IDENTITAS DIRI
          ═══════════════════════════════════════════════ */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-number">1</span>
          Identitas Diri
        </h3>
        <div className="form-grid">
          {/* Nama Lengkap — WAJIB */}
          <div className="form-group">
            <label>Nama Lengkap <span className="required">*</span></label>
            <input
              type="text"
              value={formData.nama_lengkap}
              onChange={e => handleChange('nama_lengkap', e.target.value)}
              onBlur={() => handleBlur('nama_lengkap')}
              placeholder="Sesuai e-KTP"
              required
              className={errors.nama_lengkap && touched.nama_lengkap ? 'input-error' : ''}
            />
            {errors.nama_lengkap && touched.nama_lengkap && (
              <span className="field-error">{errors.nama_lengkap}</span>
            )}
          </div>

          {/* Username Baru — WAJIB */}
          <div className="form-group">
            <label>Username Baru <span className="required">*</span></label>
            <input
              type="text"
              value={formData.username_baru}
              onChange={e => handleChange('username_baru', e.target.value)}
              onBlur={() => handleBlur('username_baru')}
              placeholder="Otomatis dari nama"
              required
              className={errors.username_baru && touched.username_baru ? 'input-error' : ''}
            />
            <small className="form-hint">Otomatis dari nama (huruf kecil, tanpa spasi)</small>
            {errors.username_baru && touched.username_baru && (
              <span className="field-error">{errors.username_baru}</span>
            )}
          </div>

          {/* Golongan Darah — OPSIONAL */}
          <div className="form-group">
            <label>Golongan Darah</label>
            <select
              value={formData.golongan_darah}
              onChange={e => handleChange('golongan_darah', e.target.value)}
            >
              <option value="">-- Pilih --</option>
              {GOLONGAN_DARAH_OPTIONS.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Email Aktif — OPSIONAL */}
          <div className="form-group">
            <label>Email Aktif</label>
            <input
              type="email"
              value={formData.email_aktif}
              onChange={e => handleChange('email_aktif', e.target.value)}
              placeholder="email@contoh.com"
            />
          </div>

          {/* No. Telepon — WAJIB */}
          <div className="form-group">
            <label>No. Telepon <span className="required">*</span></label>
            <input
              type="tel"
              value={formData.no_telepon}
              onChange={e => handleChange('no_telepon', e.target.value)}
              onBlur={() => handleBlur('no_telepon')}
              placeholder="08xxxxxxxxxx (min. 10 digit)"
              required
              className={errors.no_telepon && touched.no_telepon ? 'input-error' : ''}
            />
            {errors.no_telepon && touched.no_telepon && (
              <span className="field-error">{errors.no_telepon}</span>
            )}
          </div>

          {/* Status Warga — WAJIB */}
          <div className="form-group">
            <label>Status Warga <span className="required">*</span></label>
            <select
              value={formData.status_warga}
              onChange={e => handleChange('status_warga', e.target.value)}
              onBlur={() => handleBlur('status_warga')}
              required
              className={errors.status_warga && touched.status_warga ? 'input-error' : ''}
            >
              {STATUS_WARGA_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.status_warga && touched.status_warga && (
              <span className="field-error">{errors.status_warga}</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SECTION 2: RIWAYAT SAWKRAMEN & GEREJAWI
          ═══════════════════════════════════════════════ */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-number">2</span>
          Riwayat Sawkramen &amp; Gerejawi
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Tanggal Baptis</label>
            <input
              type="date"
              value={formData.tgl_baptis}
              onChange={e => handleChange('tgl_baptis', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Tanggal Sidi</label>
            <input
              type="date"
              value={formData.tgl_sidi}
              onChange={e => handleChange('tgl_sidi', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Status Perkawinan Gereja</label>
            <select
              value={formData.status_perkawinan_gereja}
              onChange={e => handleChange('status_perkawinan_gereja', e.target.value)}
            >
              {STATUS_PERKAWINAN_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SECTION 3: ALAMAT & DOMISILI
          ═══════════════════════════════════════════════ */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-number">3</span>
          Alamat &amp; Domisili
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Alamat KTP</label>
            <textarea
              value={formData.alamat_ktp}
              onChange={e => handleChange('alamat_ktp', e.target.value)}
              placeholder="Alamat sesuai KTP"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Alamat Domisili</label>
            <textarea
              value={formData.alamat_domisili}
              onChange={e => handleChange('alamat_domisili', e.target.value)}
              placeholder="Alamat tempat tinggal saat ini"
              rows={3}
            />
          </div>
          {/* Sektor Pelayanan — WAJIB */}
          <div className="form-group">
            <label>Sektor Pelayanan <span className="required">*</span></label>
            <select
              value={formData.sektor_pelayanan}
              onChange={e => handleChange('sektor_pelayanan', e.target.value)}
              onBlur={() => handleBlur('sektor_pelayanan')}
              required
              className={errors.sektor_pelayanan && touched.sektor_pelayanan ? 'input-error' : ''}
            >
              <option value="">-- Pilih Sektor --</option>
              {SEKTOR_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.sektor_pelayanan && touched.sektor_pelayanan && (
              <span className="field-error">{errors.sektor_pelayanan}</span>
            )}
            <div className="sektor-info-box">
              <p className="sektor-info-title">📋 Keterangan Sektor Pelayanan:</p>
              <ul className="sektor-info-list">
                <li><strong>Sektor 1</strong> — Wilayah Pusat / Kuta Alam &amp; Sekitarnya: Kuta Alam, Keuramat, Mulia, Peunayong, pusat kota Banda Aceh.</li>
                <li><strong>Sektor 2</strong> — Wilayah Baiturrahman / Lueng Bata / Meuraxa: Baiturrahman, Lueng Bata, Banda Raya, Ulee Lheue.</li>
                <li><strong>Sektor 3</strong> — Wilayah Aceh Besar / Darussalam / Ulee Kareng: Syiah Kuala, Ulee Kareng, Lambaro, Ketapang, Indrapuri.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          SECTION 4: UPLOAD DOKUMEN
          ═══════════════════════════════════════════════ */}
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="section-number">4</span>
          Upload Dokumen
        </h3>
        <p className="form-section-desc">
          Upload dokumen pendukung. Format: PDF, JPG, PNG. Maksimal 5 MB per file.
        </p>

        <div className="form-grid">
          {/* A1: Kartu Keluarga Jemaat */}
          <div className="form-group">
            <label className="doc-label">
              <span className="doc-code">A1</span> Kartu Keluarga Jemaat (KKJ)
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('berkas_A1', file, 'A1');
              }}
              disabled={uploading.berkas_A1}
            />
            {uploading.berkas_A1 && <span className="upload-status">⏳ Mengunggah...</span>}
            {formData.berkas_A1 && (
              <a href={formData.berkas_A1} target="_blank" rel="noopener noreferrer" className="file-link">
                ✅ Lihat File
              </a>
            )}
          </div>

          {/* A2: Surat Gerejawi */}
          <div className="form-group">
            <label className="doc-label">
              <span className="doc-code">A2</span> Surat-Surat Gerejawi
            </label>
            <small className="form-hint">Surat Baptis / Surat Sidi / Surat Perkawinan Gereja</small>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('berkas_A2', file, 'A2');
              }}
              disabled={uploading.berkas_A2}
            />
            {uploading.berkas_A2 && <span className="upload-status">⏳ Mengunggah...</span>}
            {formData.berkas_A2 && (
              <a href={formData.berkas_A2} target="_blank" rel="noopener noreferrer" className="file-link">
                ✅ Lihat File
              </a>
            )}
          </div>

          {/* A24: Surat Perkawinan Catatan Sipil */}
          <div className="form-group">
            <label className="doc-label">
              <span className="doc-code">A24</span> Surat Perkawinan Catatan Sipil
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('berkas_A24', file, 'A24');
              }}
              disabled={uploading.berkas_A24}
            />
            {uploading.berkas_A24 && <span className="upload-status">⏳ Mengunggah...</span>}
            {formData.berkas_A24 && (
              <a href={formData.berkas_A24} target="_blank" rel="noopener noreferrer" className="file-link">
                ✅ Lihat File
              </a>
            )}
          </div>

          {/* A3: Ijazah Pendidikan Terakhir */}
          <div className="form-group">
            <label className="doc-label">
              <span className="doc-code">A3</span> Ijazah Pendidikan Terakhir
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload('berkas_A3', file, 'A3');
              }}
              disabled={uploading.berkas_A3}
            />
            {uploading.berkas_A3 && <span className="upload-status">⏳ Mengunggah...</span>}
            {formData.berkas_A3 && (
              <a href={formData.berkas_A3} target="_blank" rel="noopener noreferrer" className="file-link">
                ✅ Lihat File
              </a>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            BERKAS MAJELIS (Conditional — wajib jika Presbiter/Majelis)
            ═══════════════════════════════════════════ */}
        {isMajelisOrPresbiter && (
          <div className="form-section majelis-section" style={{ marginTop: '20px' }}>
            <h3 className="form-section-title majelis-title">
              <span className="section-number">✨</span>
              Berkas Khusus {formData.status_warga} <span className="required">*</span>
            </h3>
            <p className="form-section-desc">
              Berkas ini <strong>wajib</strong> diunggah karena Anda terdaftar sebagai <strong>{formData.status_warga}</strong>.
            </p>
            <div className="form-grid">
              {/* M1: Surat Kesediaan — WAJIB untuk Majelis */}
              <div className="form-group">
                <label className="doc-label">
                  <span className="doc-code">M1</span> Surat Kesediaan <span className="required">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('berkas_majelis_surat_kesediaan', file, 'M1');
                  }}
                  disabled={uploading.berkas_majelis_surat_kesediaan}
                />
                {uploading.berkas_majelis_surat_kesediaan && <span className="upload-status">⏳ Mengunggah...</span>}
                {formData.berkas_majelis_surat_kesediaan && (
                  <a href={formData.berkas_majelis_surat_kesediaan} target="_blank" rel="noopener noreferrer" className="file-link">
                    ✅ Lihat File
                  </a>
                )}
                {errors.berkas_majelis_surat_kesediaan && (
                  <span className="field-error">{errors.berkas_majelis_surat_kesediaan}</span>
                )}
              </div>

              {/* M2: Surat Pernyataan Pilihan — WAJIB untuk Majelis */}
              <div className="form-group">
                <label className="doc-label">
                  <span className="doc-code">M2</span> Surat Pernyataan Pilihan <span className="required">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('berkas_majelis_surat_pilihan', file, 'M2');
                  }}
                  disabled={uploading.berkas_majelis_surat_pilihan}
                />
                {uploading.berkas_majelis_surat_pilihan && <span className="upload-status">⏳ Mengunggah...</span>}
                {formData.berkas_majelis_surat_pilihan && (
                  <a href={formData.berkas_majelis_surat_pilihan} target="_blank" rel="noopener noreferrer" className="file-link">
                    ✅ Lihat File
                  </a>
                )}
                {errors.berkas_majelis_surat_pilihan && (
                  <span className="field-error">{errors.berkas_majelis_surat_pilihan}</span>
                )}
              </div>

              {/* M3: Surat Pernyataan Loyalitas — WAJIB untuk Majelis */}
              <div className="form-group">
                <label className="doc-label">
                  <span className="doc-code">M3</span> Surat Pernyataan Loyalitas <span className="required">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('berkas_majelis_surat_loyalitas', file, 'M3');
                  }}
                  disabled={uploading.berkas_majelis_surat_loyalitas}
                />
                {uploading.berkas_majelis_surat_loyalitas && <span className="upload-status">⏳ Mengunggah...</span>}
                {formData.berkas_majelis_surat_loyalitas && (
                  <a href={formData.berkas_majelis_surat_loyalitas} target="_blank" rel="noopener noreferrer" className="file-link">
                    ✅ Lihat File
                  </a>
                )}
                {errors.berkas_majelis_surat_loyalitas && (
                  <span className="field-error">{errors.berkas_majelis_surat_loyalitas}</span>
                )}
              </div>

              {/* M4: Surat Loyalitas Suami-Istri — OPSIONAL */}
              <div className="form-group">
                <label className="doc-label">
                  <span className="doc-code">M4</span> Surat Pernyataan Loyalitas Suami-Istri
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('berkas_majelis_surat_loyalitas_pasangan', file, 'M4');
                  }}
                  disabled={uploading.berkas_majelis_surat_loyalitas_pasangan}
                />
                {uploading.berkas_majelis_surat_loyalitas_pasangan && <span className="upload-status">⏳ Mengunggah...</span>}
                {formData.berkas_majelis_surat_loyalitas_pasangan && (
                  <a href={formData.berkas_majelis_surat_loyalitas_pasangan} target="_blank" rel="noopener noreferrer" className="file-link">
                    ✅ Lihat File
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
          ERROR SUMMARY & SUBMIT
          ═══════════════════════════════════════════════ */}
      {Object.keys(errors).length > 0 && (
        <div className="form-error-summary">
          <p>⚠️ <strong>Ada {Object.keys(errors).length} data yang perlu dilengkapi:</strong></p>
          <ul>
            {Object.entries(errors).map(([field, msg]) => (
              <li key={field}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="btn-save"
          disabled={isSubmitting || Object.values(uploading).some(Boolean)}
        >
          {isSubmitting ? '⏳ Mengirim...' : 'KIRIM DATA JEMAAT'}
        </button>
        {onCancel && (
          <button type="button" className="btn-delete" onClick={onCancel}>
            BATAL
          </button>
        )}
      </div>
    </form>
  );
};

export default DataUmatForm;
