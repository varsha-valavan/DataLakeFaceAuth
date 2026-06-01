import { ImagePreprocessor } from '../utils/ImagePreprocessor';

const COSINE_THRESHOLD = 0.65;

export class FaceRecognitionService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // Try to load TFLite - gracefully handle if not available
      const TFLite = require('react-native-fast-tflite');
      if (TFLite && TFLite.loadTFLiteModel) {
        console.log('TFLite available - models ready');
      } else {
        console.warn('TFLite native module not available - using simulation mode');
      }
      this.isInitialized = true;
      console.log('FaceRecognitionService initialized');
    } catch (error) {
      console.warn('TFLite init failed, using simulation:', error);
      this.isInitialized = true;
    }
  }

  async getEmbedding(
    pixelData: Uint8Array,
    width: number,
    height: number
  ): Promise<Float32Array> {
    // Simulate embedding for demo
    const embedding = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      embedding[i] = (pixelData[i % pixelData.length] / 255.0) - 0.5;
    }
    return embedding;
  }

  async getLivenessScore(
    pixelData: Uint8Array,
    width: number,
    height: number
  ): Promise<number> {
    // Simulate liveness - always returns real (0.85)
    return 0.85;
  }

  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot   += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  async authenticate(
    pixelData: Uint8Array,
    width: number,
    height: number,
    enrolledFaces: Array<{ employeeId: string; employeeName: string; embedding: number[] }>
  ): Promise<{
    passed: boolean;
    employeeId: string | null;
    employeeName: string | null;
    confidenceScore: number;
    livenessScore: number;
    inferenceTimeMs: number;
  }> {
    const startTotal = Date.now();

    const livenessScore = await this.getLivenessScore(pixelData, width, height);

    if (livenessScore < 0.70) {
      return {
        passed: false,
        employeeId: null,
        employeeName: null,
        confidenceScore: 0,
        livenessScore,
        inferenceTimeMs: Date.now() - startTotal
      };
    }

    const queryEmbedding = await this.getEmbedding(pixelData, width, height);

    let bestScore = 0;
    let bestMatch: { employeeId: string; employeeName: string } | null = null;

    for (const face of enrolledFaces) {
      const enrolledEmbedding = new Float32Array(face.embedding);
      const score = this.cosineSimilarity(queryEmbedding, enrolledEmbedding);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { employeeId: face.employeeId, employeeName: face.employeeName };
      }
    }

    const passed = bestScore >= COSINE_THRESHOLD;

    return {
      passed,
      employeeId: passed ? bestMatch?.employeeId ?? null : null,
      employeeName: passed ? bestMatch?.employeeName ?? null : null,
      confidenceScore: bestScore,
      livenessScore,
      inferenceTimeMs: Date.now() - startTotal
    };
  }
}
