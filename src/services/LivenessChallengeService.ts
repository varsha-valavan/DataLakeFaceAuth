import { ChallengeType, FaceLandmark } from '../types';

export class LivenessChallengeService {
  private requiredChallenges: ChallengeType[] = [];
  private completedChallenges: Set<ChallengeType> = new Set();
  private blinkHistory: boolean[] = [];
  private frameCount = 0;

  generateChallenges(): ChallengeType[] {
    const all: ChallengeType[] = ['blink', 'smile', 'turn_left', 'turn_right'];
    // Shuffle and pick 2 random challenges
    const shuffled = all.sort(() => Math.random() - 0.5);
    this.requiredChallenges = shuffled.slice(0, 2);
    this.completedChallenges.clear();
    this.blinkHistory = [];
    this.frameCount = 0;
    return [...this.requiredChallenges];
  }

  getCurrentChallenge(): ChallengeType | null {
    for (const c of this.requiredChallenges) {
      if (!this.completedChallenges.has(c)) return c;
    }
    return null;
  }

  processFrame(landmarks: FaceLandmark[]): ChallengeType | null {
    if (landmarks.length < 468) return null;
    this.frameCount++;

    const current = this.getCurrentChallenge();
    if (!current) return null;

    let detected = false;

    switch (current) {
      case 'blink':
        detected = this.detectBlink(landmarks);
        break;
      case 'smile':
        detected = this.detectSmile(landmarks);
        break;
      case 'turn_left':
        detected = this.detectHeadTurn(landmarks, 'left');
        break;
      case 'turn_right':
        detected = this.detectHeadTurn(landmarks, 'right');
        break;
    }

    if (detected) {
      this.completedChallenges.add(current);
      return current;
    }

    return null;
  }

  isAllComplete(): boolean {
    return this.completedChallenges.size >= this.requiredChallenges.length;
  }

  getProgress(): { completed: number; total: number } {
    return {
      completed: this.completedChallenges.size,
      total: this.requiredChallenges.length
    };
  }

  private eyeAspectRatio(landmarks: FaceLandmark[], side: 'left' | 'right'): number {
    // MediaPipe Face Mesh indices
    const idx = side === 'left'
      ? { p1: 33, p2: 160, p3: 158, p4: 133, p5: 153, p6: 144 }
      : { p1: 362, p2: 385, p3: 387, p4: 263, p5: 373, p6: 380 };

    const dist = (a: FaceLandmark, b: FaceLandmark) =>
      Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

    const v1 = dist(landmarks[idx.p2], landmarks[idx.p6]);
    const v2 = dist(landmarks[idx.p3], landmarks[idx.p5]);
    const h  = dist(landmarks[idx.p1], landmarks[idx.p4]);

    return (v1 + v2) / (2.0 * h);
  }

  private detectBlink(landmarks: FaceLandmark[]): boolean {
    const leftEAR  = this.eyeAspectRatio(landmarks, 'left');
    const rightEAR = this.eyeAspectRatio(landmarks, 'right');
    const avgEAR   = (leftEAR + rightEAR) / 2;

    this.blinkHistory.push(avgEAR < 0.20);
    if (this.blinkHistory.length > 10) this.blinkHistory.shift();

    // Detect a blink: was open, then closed, then open again
    if (this.blinkHistory.length >= 5) {
      const recent = this.blinkHistory.slice(-5);
      const wasClosed = recent.slice(1, 3).every(v => v === true);
      const isOpen    = recent[recent.length - 1] === false;
      return wasClosed && isOpen;
    }
    return false;
  }

  private detectSmile(landmarks: FaceLandmark[]): boolean {
    // Lip corners and center
    const leftCorner  = landmarks[61];
    const rightCorner = landmarks[291];
    const upperLip    = landmarks[13];
    const lowerLip    = landmarks[14];

    const mouthWidth  = Math.abs(rightCorner.x - leftCorner.x);
    const mouthHeight = Math.abs(lowerLip.y - upperLip.y);

    // Smile = wide mouth relative to height
    return mouthHeight > 0 && (mouthWidth / mouthHeight) > 3.2;
  }

  private detectHeadTurn(landmarks: FaceLandmark[], dir: 'left' | 'right'): boolean {
    const noseTip    = landmarks[1];
    const leftCheek  = landmarks[234];
    const rightCheek = landmarks[454];

    const faceWidth  = Math.abs(rightCheek.x - leftCheek.x);
    const faceCenter = (leftCheek.x + rightCheek.x) / 2;

    if (faceWidth === 0) return false;

    const offset = (noseTip.x - faceCenter) / faceWidth;

    return dir === 'left' ? offset < -0.22 : offset > 0.22;
  }
}