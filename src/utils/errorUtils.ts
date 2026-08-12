/**
 * Mengekstrak pesan error yang ramah untuk ditampilkan dari nilai yang tidak diketahui
 * (misalnya hasil `catch (err)` yang bertipe `unknown`).
 */
export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string' && error) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg) return msg;
  }
  return fallback;
}
