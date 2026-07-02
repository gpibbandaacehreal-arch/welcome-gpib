import { supabase } from '../services/supabase';

/**
 * Kompresi gambar base64
 * @param base64Str String base64 asli
 * @param maxWidth Lebar maksimum gambar (default 800px)
 * @param quality Kualitas kompresi (0.1 - 1.0)
 * @returns Promise<string> string base64 yang sudah dikompresi
 */
export const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    // Jika bukan base64 image, langsung kembalikan
    if (!base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Hitung proporsi jika lebar melebihi batas
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Gambar ulang ke canvas dengan ukuran baru
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export ke JPEG dengan kualitas yang ditentukan
      // JPEG lebih efisien untuk foto daripada PNG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

/**
 * Mengekstrak File ID dari berbagai pola URL Google Drive
 * @param url URL gambar Google Drive
 * @returns string File ID atau null jika tidak cocok
 */
export const extractGoogleDriveFileId = (url: string): string | null => {
  if (!url) return null;
  
  // 1. lh3.googleusercontent.com/d/FILE_ID
  const lh3dMatch = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3dMatch) return lh3dMatch[1];

  // 2. drive.google.com/uc?id=FILE_ID
  const driveUcMatch = url.match(/drive\.google\.com\/uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/);
  if (driveUcMatch) return driveUcMatch[1];

  // 3. drive.google.com/file/d/FILE_ID/view
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) return driveFileMatch[1];

  // 4. drive.google.com/open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) return driveOpenMatch[1];

  // 5. lh3.googleusercontent.com/drive-viewer/FILE_ID
  const lh3ViewerMatch = url.match(/lh3\.googleusercontent\.com\/drive-viewer\/([a-zA-Z0-9_-]+)/);
  if (lh3ViewerMatch) return lh3ViewerMatch[1];

  return null;
};

/**
 * Mengonversi URL Google Drive ke URL ImageKit Proxy CDN
 * @param url URL asli
 * @param width Lebar gambar opsional
 * @returns URL terkonversi atau URL asli jika tidak cocok
 */
export const toImageKitUrl = (url: string, width?: number): string => {
  const endpoint = import.meta.env.VITE_IMAGEKIT_ENDPOINT;
  if (!endpoint || !url) return url;

  // Jika berupa base64, kembalikan asli
  if (url.startsWith('data:')) return url;

  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
    return `${cleanEndpoint}/d/${fileId}${tr}`;
  }

  return url;
};

/**
 * Menyaring HTML content dan mengubah semua URL gambar Google Drive di dalam tag <img> ke ImageKit
 * @param html string HTML dari editor / database
 * @returns string HTML yang sudah disaring
 */
export const filterHtmlImages = (html: string): string => {
  if (!html) return '';
  
  // Regex untuk mencari tag <img> dan src-nya (baik double quotes maupun single quotes)
  return html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (_, before, src, after) => {
    const newSrc = toImageKitUrl(src, 800);
    return `<img ${before}src="${newSrc}"${after}>`;
  });
};

/**
 * Helper untuk mengubah string base64 menjadi Blob
 */
export const base64ToBlob = (base64: string, contentType: string): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

/**
 * Mengompres dan mengunggah gambar base64 ke Supabase Cloud Storage
 * @param base64Str string base64 gambar
 * @returns Promise<string> Public URL dari file yang diunggah
 */
export const uploadImageToCloud = async (base64Str: string): Promise<string> => {
  if (!base64Str.startsWith('data:image')) {
    return base64Str;
  }

  // 1. Ekstrak content type
  const match = base64Str.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const contentType = match ? match[1] : 'image/jpeg';
  
  // 2. Ubah base64 ke Blob
  const blob = base64ToBlob(base64Str, contentType);
  
  // 3. Nama file unik dengan prefix folder images/
  const extension = contentType.split('/')[1] || 'jpg';
  const fileName = `images/img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;
  
  // 4. Upload ke bucket 'beranda-pdf' di Supabase
  const { error } = await supabase.storage
    .from('beranda-pdf')
    .upload(fileName, blob, { contentType, upsert: true });
    
  if (error) {
    throw new Error('Gagal mengunggah gambar ke cloud storage: ' + error.message);
  }
  
  // 5. Dapatkan public URL
  const { data: { publicUrl } } = supabase.storage
    .from('beranda-pdf')
    .getPublicUrl(fileName);
    
  return publicUrl;
};
