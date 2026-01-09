import html2canvas from 'html2canvas';
import { EXPORT_SIZES } from '../types';
import type { MapFormat } from '../types';

/**
 * Export map container as PNG at format-dependent size
 * Uses html2canvas to render DOM to PNG with 2x scale
 */
export async function exportMap(
  containerSelector: string,
  format: MapFormat,
  filename?: string
): Promise<void> {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    const size = EXPORT_SIZES[format];

    const canvas = await html2canvas(container as HTMLElement, {
      width: size.width,
      height: size.height,
      scale: 2, // 2x for clarity
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Convert to PNG and download
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download =
      filename || `mapflam_${format}_${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

/**
 * Generate thumbnail: render container as 64×64 PNG base64
 * Useful for SavedTab preview
 */
export async function generateThumbnail(containerSelector: string): Promise<string> {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    const canvas = await html2canvas(container as HTMLElement, {
      width: 64,
      height: 64,
      scale: 1,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    // Return placeholder if generation fails
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}
