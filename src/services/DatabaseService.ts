import SQLite from 'react-native-sqlite-storage';
import { AuthLog, EnrolledFace } from '../types';

SQLite.enablePromise(true);

const DB_NAME = 'datalake_faceauth.db';
const DB_ENCRYPTION_KEY = 'DL3-secure-key-2024-change-this';

export class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabase({
      name: DB_NAME,
      location: 'default',
    });

    await this.createTables();
    console.log('Database initialized');
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('DB not open');

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS enrolled_faces (
        id          TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL,
        employee_name TEXT NOT NULL,
        embedding   TEXT NOT NULL,
        enrolled_at INTEGER NOT NULL,
        is_synced   INTEGER DEFAULT 0
      );
    `);

    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS auth_logs (
        id               TEXT PRIMARY KEY,
        employee_id      TEXT,
        employee_name    TEXT,
        timestamp        INTEGER NOT NULL,
        latitude         REAL DEFAULT 0,
        longitude        REAL DEFAULT 0,
        passed           INTEGER NOT NULL,
        confidence_score REAL NOT NULL,
        liveness_score   REAL NOT NULL,
        is_synced        INTEGER DEFAULT 0
      );
    `);

    await this.db.executeSql(
      `CREATE INDEX IF NOT EXISTS idx_auth_logs_synced ON auth_logs(is_synced);`
    );
  }

  async enrollFace(
    employeeId: string,
    employeeName: string,
    embedding: Float32Array
  ): Promise<void> {
    if (!this.db) throw new Error('DB not open');

    const id = `${employeeId}_${Date.now()}`;
    const embeddingJson = JSON.stringify(Array.from(embedding));

    await this.db.executeSql(
      `INSERT OR REPLACE INTO enrolled_faces 
       (id, employee_id, employee_name, embedding, enrolled_at, is_synced) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, employeeId, employeeName, embeddingJson, Date.now()]
    );
  }

  async getAllEnrolledFaces(): Promise<EnrolledFace[]> {
    if (!this.db) throw new Error('DB not open');

    const [result] = await this.db.executeSql(
      `SELECT * FROM enrolled_faces ORDER BY enrolled_at DESC`
    );

    const faces: EnrolledFace[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      faces.push({
        id: row.id,
        employeeId: row.employee_id,
        employeeName: row.employee_name,
        embedding: JSON.parse(row.embedding),
        enrolledAt: row.enrolled_at
      });
    }
    return faces;
  }

  async logAuthAttempt(log: AuthLog): Promise<void> {
    if (!this.db) throw new Error('DB not open');

    await this.db.executeSql(
      `INSERT INTO auth_logs 
       (id, employee_id, employee_name, timestamp, latitude, longitude, 
        passed, confidence_score, liveness_score, is_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        log.id,
        log.employeeId || 'UNKNOWN',
        '',
        log.timestamp,
        log.latitude,
        log.longitude,
        log.passed ? 1 : 0,
        log.confidenceScore,
        log.livenessScore
      ]
    );
  }

  async getUnsyncedLogs(limit = 100): Promise<AuthLog[]> {
    if (!this.db) throw new Error('DB not open');

    const [result] = await this.db.executeSql(
      `SELECT * FROM auth_logs WHERE is_synced = 0 ORDER BY timestamp ASC LIMIT ?`,
      [limit]
    );

    const logs: AuthLog[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      logs.push({
        id: row.id,
        employeeId: row.employee_id,
        timestamp: row.timestamp,
        latitude: row.latitude,
        longitude: row.longitude,
        passed: row.passed === 1,
        confidenceScore: row.confidence_score,
        livenessScore: row.liveness_score
      });
    }
    return logs;
  }

  async markLogsAsSynced(ids: string[]): Promise<void> {
    if (!this.db || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.db.executeSql(
      `UPDATE auth_logs SET is_synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  }

  async purgeOldSyncedLogs(): Promise<number> {
    if (!this.db) throw new Error('DB not open');
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    const [result] = await this.db.executeSql(
      `DELETE FROM auth_logs WHERE is_synced = 1 AND timestamp < ?`,
      [cutoff]
    );
    console.log(`Purged ${result.rowsAffected} old records`);
    return result.rowsAffected;
  }

  async getPendingCount(): Promise<number> {
    if (!this.db) return 0;
    const [result] = await this.db.executeSql(
      `SELECT COUNT(*) as count FROM auth_logs WHERE is_synced = 0`
    );
    return result.rows.item(0).count;
  }
}