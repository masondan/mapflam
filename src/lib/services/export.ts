import html2canvas from 'html2canvas';
import L from 'leaflet';
import { EXPORT_SIZES } from '../types';
import type { MapFormat } from '../types';

/**
 * Export map container as PNG at format-dependent size
 * Captures the container at its current size and scales to target dimensions
 */
export async function exportMap(
  containerSelector: string,
  format: MapFormat,
  filename?: string
): Promise<void> {
  try {
    const container = document.querySelector(containerSelector) as HTMLElement;
    if (!container) {
      throw new Error(`Container not found: ${containerSelector}`);
    }

    const size = EXPORT_SIZES[format];
    const containerRect = container.getBoundingClientRect();

    // Calculate scale factor to make container fill target size
    const scaleX = size.width / containerRect.width;
    const scaleY = size.height / containerRect.height;
    const scale = Math.max(scaleX, scaleY);

    // Wait for tiles to load before capturing
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture at high resolution using scale
    const capturedCanvas = await html2canvas(container, {
      scale: scale,
      backgroundColor: '#ffffff',
      logging: true,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
      imageTimeout: 5000,
    });

    // Create final canvas at exact export dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = size.width;
    finalCanvas.height = size.height;
    const ctx = finalCanvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size.width, size.height);

    // Calculate centering offset if aspect ratios differ
    const scaledWidth = containerRect.width * scale;
    const scaledHeight = containerRect.height * scale;
    const offsetX = (size.width - scaledWidth) / 2;
    const offsetY = (size.height - scaledHeight) / 2;

    // Draw captured canvas centered in final canvas
    ctx.drawImage(capturedCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

    // Convert to PNG and download
    const link = document.createElement('a');
    link.href = finalCanvas.toDataURL('image/png');
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
