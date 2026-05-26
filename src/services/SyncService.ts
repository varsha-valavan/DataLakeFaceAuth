import NetInfo from '@react-native-community/netinfo';
import { DatabaseService } from './DatabaseService';
import { AuthLog } from '../types';

const AWS_REGION = 'ap-south-1';
const DYNAMO_TABLE = 'DataLakeAuthLogs';
const BATCH_SIZE = 25;

export class SyncService {
  private db: DatabaseService;
  private isSyncing = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  startWatching(onSyncComplete?: (result: { synced: number; purged: number }) => void): void {
    this.unsubscribeNetInfo = NetInfo.addEventListener(async (state) => {
      if (
        state.isConnected &&
        state.isInternetReachable &&
        !this.isSyncing
      ) {
        console.log('Network available — starting sync...');
        const result = await this.syncNow();
        if (onSyncComplete) onSyncComplete(result);
      }
    });
  }

  stopWatching(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  async syncNow(): Promise<{ synced: number; purged: number }> {
    if (this.isSyncing) return { synced: 0, purged: 0 };
    this.isSyncing = true;

    let totalSynced = 0;
    let totalPurged = 0;

    try {
      const unsyncedLogs = await this.db.getUnsyncedLogs(500);

      if (unsyncedLogs.length === 0) {
        console.log('Nothing to sync');
        return { synced: 0, purged: 0 };
      }

      console.log(`Syncing ${unsyncedLogs.length} records...`);

      // Process in batches
      for (let i = 0; i < unsyncedLogs.length; i += BATCH_SIZE) {
        const batch = unsyncedLogs.slice(i, i + BATCH_SIZE);

        try {
          await this.pushBatchToAWS(batch);
          await this.db.markLogsAsSynced(batch.map(r => r.id));
          totalSynced += batch.length;
          console.log(`Synced batch ${Math.floor(i / BATCH_SIZE) + 1}`);
        } catch (batchError) {
          console.error('Batch sync failed, stopping:', batchError);
          break; // Stop on failure — retry next time
        }
      }

      // Purge old synced records
      totalPurged = await this.db.purgeOldSyncedLogs();

    } finally {
      this.isSyncing = false;
    }

    return { synced: totalSynced, purged: totalPurged };
  }

  private async pushBatchToAWS(logs: AuthLog[]): Promise<void> {
    const AWS = require('aws-sdk');

    AWS.config.update({
      region: AWS_REGION,
      // In production: use Cognito Identity Pool, NOT hardcoded keys
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    const dynamodb = new AWS.DynamoDB.DocumentClient();

    const requestItems = logs.map(log => ({
      PutRequest: {
        Item: {
          id: log.id,
          employee_id: log.employeeId,
          timestamp: log.timestamp,
          date: new Date(log.timestamp).toISOString().split('T')[0],
          location: {
            latitude: log.latitude,
            longitude: log.longitude
          },
          auth_result: {
            passed: log.passed,
            confidence_score: parseFloat(log.confidenceScore.toFixed(4)),
            liveness_score: parseFloat(log.livenessScore.toFixed(4))
          },
          ttl: Math.floor(log.timestamp / 1000) + (90 * 24 * 60 * 60) // 90 day TTL
        }
      }
    }));

    await dynamodb.batchWrite({
      RequestItems: { [DYNAMO_TABLE]: requestItems }
    }).promise();
  }
}