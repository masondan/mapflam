import html2canvas from 'html2canvas';
import L from 'leaflet';
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
 * Generate thumbnail: render container as 102×102 PNG base64
 * Useful for SavedTab preview
 * Uses Leaflet's native canvas rendering
 */
export async function generateThumbnail(containerSelector: string): Promise<string> {
  try {
    const container = document.querySelector(containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    // Wait for Leaflet tiles to load and settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to find a Leaflet map instance
    const mapElement = container.querySelector('.leaflet-container') as any;
    let leafletMap: any = null;
    
    // Look for Leaflet map via window._leafletmap or similar
    if ((window as any)._leaflet_map) {
      leafletMap = (window as any)._leaflet_map;
    } else if (mapElement && mapElement._leaflet) {
      leafletMap = mapElement._leaflet;
    }

    // Use html2canvas with enhanced settings for Leaflet
    const canvas = await html2canvas(container as HTMLElement, {
      width: 102,
      height: 102,
      scale: 1.5, // Slightly higher scale for better quality
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      proxy: undefined,
      imageTimeout: 2000,
      removeContainer: true,
      ignoreElements: (element) => {
        // Ignore Leaflet attribution and controls for cleaner thumbnail
        const classList = (element as HTMLElement).classList;
        if (classList?.contains('leaflet-control-attribution')) return true;
        if (classList?.contains('leaflet-control')) return true;
        if (classList?.contains('leaflet-control-zoom')) return true;
        return false;
      },
    });

    const dataUrl = canvas.toDataURL('image/png');
    console.log('Thumbnail captured, size:', dataUrl.length, 'bytes');
    return dataUrl;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    // Return placeholder if generation fails
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}
