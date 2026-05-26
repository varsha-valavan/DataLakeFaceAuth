export interface FaceLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface AuthLog {
  id: string;
  employeeId: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  passed: boolean;
  confidenceScore: number;
  livenessScore: number;
  isSynced?: boolean;
}

export interface EnrolledFace {
  id: string;
  employeeId: string;
  employeeName: string;
  embedding: number[];
  enrolledAt: number;
}

export interface AuthResult {
  passed: boolean;
  confidenceScore: number;
  livenessScore: number;
  employeeId?: string;
  employeeName?: string;
  failReason?: string;
}

export type ChallengeType = 'blink' | 'smile' | 'turn_left' | 'turn_right';

export interface SyncStatus {
  pendingCount: number;
  lastSyncTime: number | null;
  isSyncing: boolean;
}