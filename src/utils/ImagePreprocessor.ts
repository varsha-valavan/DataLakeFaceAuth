export class ImagePreprocessor {
  // Normalize pixel values to [-1, 1] range (required by MobileFaceNet)
  static normalizeForRecognition(pixelData: Uint8Array, width: number, height: number): Float32Array {
    const output = new Float32Array(112 * 112 * 3);
    
    // Resize to 112x112 (bilinear interpolation)
    const scaleX = width / 112;
    const scaleY = height / 112;

    for (let y = 0; y < 112; y++) {
      for (let x = 0; x < 112; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * width + srcX) * 4; // RGBA
        const dstIdx = (y * 112 + x) * 3;

        // Normalize: (pixel - 127.5) / 128
        output[dstIdx]     = (pixelData[srcIdx]     - 127.5) / 128.0; // R
        output[dstIdx + 1] = (pixelData[srcIdx + 1] - 127.5) / 128.0; // G
        output[dstIdx + 2] = (pixelData[srcIdx + 2] - 127.5) / 128.0; // B
      }
    }
    return output;
  }

  // Normalize for liveness model (128x128, [0,1] range)
  static normalizeForLiveness(pixelData: Uint8Array, width: number, height: number): Float32Array {
    const output = new Float32Array(128 * 128 * 3);
    const scaleX = width / 128;
    const scaleY = height / 128;

    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 128; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * 128 + x) * 3;

        output[dstIdx]     = pixelData[srcIdx]     / 255.0;
        output[dstIdx + 1] = pixelData[srcIdx + 1] / 255.0;
        output[dstIdx + 2] = pixelData[srcIdx + 2] / 255.0;
      }
    }
    return output;
  }

  // Apply CLAHE-like contrast enhancement for low-light conditions
  static enhanceLowLight(pixelData: Uint8Array): Uint8Array {
    const enhanced = new Uint8Array(pixelData.length);
    
    // Calculate histogram
    const hist = new Array(256).fill(0);
    for (let i = 0; i < pixelData.length; i += 4) {
      const gray = Math.round(0.299 * pixelData[i] + 0.587 * pixelData[i+1] + 0.114 * pixelData[i+2]);
      hist[gray]++;
    }

    // Calculate CDF
    const cdf = new Array(256).fill(0);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + hist[i];
    }

    const pixelCount = pixelData.length / 4;
    const cdfMin = cdf.find(v => v > 0) || 0;

    // Apply equalization
    for (let i = 0; i < pixelData.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const val = pixelData[i + c];
        enhanced[i + c] = Math.round(((cdf[val] - cdfMin) / (pixelCount - cdfMin)) * 255);
      }
      enhanced[i + 3] = pixelData[i + 3]; // preserve alpha
    }

    return enhanced;
  }
}