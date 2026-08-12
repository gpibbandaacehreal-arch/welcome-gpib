/**
 * Konfigurasi toolbar Quill (modules & formats) yang dipakai bersama
 * oleh EditorToolbar (container) dan EditorUtama (ReactQuill).
 * Dipisah ke file non-komponen agar react-refresh (Fast Refresh) tetap jalan.
 */

export const modules = {
  toolbar: {
    container: "#toolbar",
  },
};

export const formats = [
  "header",
  "bold", "italic", "underline", "strike",
  "list",
  "link", "image",
];
