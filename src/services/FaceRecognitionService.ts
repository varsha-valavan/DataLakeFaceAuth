import { loadTFLiteModel, TFLiteModel } from 'react-native-fast-tflite';
import { ImagePreprocessor } from '../utils/ImagePreprocessor';

const COSINE_THRESHOLD = 0.65;
const RECOGNITION_MODEL_PATH = 'models/mobilefacenet_int8.tflite';
const LIVENESS_MODEL_PATH = 'models/liveness_model.tflite';

export class FaceRecognitionService {
  private recognitionModel: TFLiteModel | null = null;
  private livenessModel: TFLiteModel | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      console.log('Loading face recognition model...');
      this.recognitionModel = await loadTFLiteModel(RECOGNITION_MODEL_PATH);
      
      console.log('Loading liveness model...');
      this.livenessModel = await loadTFLiteModel(LIVENESS_MODEL_PATH);
      
      this.isInitialized = true;
      console.log('Both models loaded successfully');
    } catch (error) {
      console.error('Model initialization failed:', error);
      throw error;
    }
  }

  async getEmbedding(
    pixelData: Uint8Array,
    width: number,
    height: number
  ): Promise<Float32Array> {
    if (!this.recognitionModel) throw new Error('Model not initialized');

    const normalized = ImagePreprocessor.normalizeForRecognition(pixelData, width, height);
    
    const start = Date.now();
    const output = await this.recognitionModel.run([normalized]);
    const inferenceTime = Date.now() - start;
    
    console.log(`Recognition inference: ${inferenceTime}ms`);
    return output[0] as Float32Array;
  }

  async getLivenessScore(
    pixelData: Uint8Array,
    width: number,
    height: number
  ): Promise<number> {
    if (!this.livenessModel) throw new Error('Liveness model not initialized');

    const normalized = ImagePreprocessor.normalizeForLiveness(pixelData, width, height);
    const output = await this.livenessModel.run([normalized]);
    
    return (output[0] as Float32Array)[0]; // 0 = spoof, 1 = real
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

    // Step 1: Liveness check first
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

    // Step 2: Get embedding of current face
    const queryEmbedding = await this.getEmbedding(pixelData, width, height);

    // Step 3: Compare against all enrolled faces
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