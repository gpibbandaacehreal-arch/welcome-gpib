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

export const toImageKitUrl = (url: string, width?: number): string => {
  const endpoint = import.meta.env.VITE_IMAGEKIT_ENDPOINT;
  if (!endpoint || !url) return url;

  // 1. Jika berupa base64, kembalikan asli
  if (url.startsWith('data:')) return url;

  const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;

  // 2. Jika sudah berupa URL ImageKit, jangan diubah lagi
  if (url.startsWith(cleanEndpoint)) {
    if (url.includes('?tr=')) return url;
    const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
    return `${url}${tr}`;
  }

  // 3. Google Drive
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
    return `${cleanEndpoint}/d/${fileId}${tr}`;
  }

  // 4. Supabase Storage
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    try {
      const parsed = new URL(url);
      const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
      return `${cleanEndpoint}${parsed.pathname}${tr}`;
    } catch (e) {
      // ignore
    }
  }

  // 5. Relative URL (misal: /LOGO_GPIB_BANDA_ACEH.png atau LOGO_GPIB.jpg)
  if (url.startsWith('/')) {
    const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
    return `${cleanEndpoint}${url}${tr}`;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
    return `${cleanEndpoint}/${url}${tr}`;
  }

  // 6. Absolute URL untuk domain kita sendiri (welcome-gpib.vercel.app atau localhost)
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (hostname === 'welcome-gpib.vercel.app' || hostname === 'localhost' || hostname === '127.0.0.1') {
      const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
      return `${cleanEndpoint}${parsed.pathname}${tr}`;
    }
    
    // 7. Domain eksternal lainnya (proxy via ImageKit jika diatur)
    const tr = width ? `?tr=w-${width},q-80` : `?tr=q-80`;
    return `${cleanEndpoint}${parsed.pathname}${parsed.search}${tr}`;
  } catch (e) {
    // ignore
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
 * Mengompres dan mengunggah gambar base64 atau File ke Supabase Cloud Storage
 * @param input string base64 gambar atau File object
 * @returns Promise<string> Public URL (dengan ImageKit Proxy) dari file yang diunggah
 */
export const uploadImageToCloud = async (input: string | File): Promise<string> => {
  if (typeof input === 'string') {
    if (!input.startsWith('data:image')) {
      return toImageKitUrl(input);
    }

    // 1. Ekstrak content type
    const match = input.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const contentType = match ? match[1] : 'image/jpeg';
    
    // 2. Ubah base64 ke Blob
    const blob = base64ToBlob(input, contentType);
    
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
    
    // 5. Dapatkan public URL dan bungkus dengan toImageKitUrl
    const { data: { publicUrl } } = supabase.storage
      .from('beranda-pdf')
      .getPublicUrl(fileName);
      
    return toImageKitUrl(publicUrl);
  } else {
    // Handling File object
    const contentType = input.type || 'image/jpeg';
    const extension = input.name.split('.').pop() || 'jpg';
    const fileName = `images/img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;

    const { error } = await supabase.storage
      .from('beranda-pdf')
      .upload(fileName, input, { contentType, upsert: true });

    if (error) {
      throw new Error('Gagal mengunggah file gambar ke cloud storage: ' + error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('beranda-pdf')
      .getPublicUrl(fileName);

    return toImageKitUrl(publicUrl);
  }
};
