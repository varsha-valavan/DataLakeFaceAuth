import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert
} from 'react-native';
import { DatabaseService } from '../services/DatabaseService';
import { SyncService } from '../services/SyncService';

interface Props {
  navigation: any;
  db: DatabaseService;
  syncService: SyncService;
}

export const HomeScreen: React.FC<Props> = ({ navigation, db, syncService }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    const count = await db.getPendingCount();
    setPendingCount(count);
  };

  const handleManualSync = async () => {
    setSyncStatus('Syncing...');
    const result = await syncService.syncNow();
    setSyncStatus(`Synced ${result.synced} records. Purged ${result.purged}.`);
    loadPendingCount();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>DataLake 3.0</Text>
      <Text style={styles.subtitle}>Field Authentication System</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Pending sync</Text>
        <Text style={styles.statusValue}>{pendingCount} records</Text>
        {syncStatus ? <Text style={styles.syncMsg}>{syncStatus}</Text> : null}
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => navigation.navigate('Auth')}
      >
        <Text style={styles.buttonText}>🔐  Authenticate</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation.navigate('Enroll')}
      >
        <Text style={styles.buttonText}>👤  Enroll New Face</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.syncButton]}
        onPress={handleManualSync}
      >
        <Text style={styles.buttonText}>☁️  Sync to AWS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E1A', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8892A4', marginBottom: 32 },
  statusCard: { backgroundColor: '#151C2C', borderRadius: 14, padding: 20, width: '100%', marginBottom: 24, alignItems: 'center' },
  statusLabel: { color: '#8892A4', fontSize: 13 },
  statusValue: { color: '#4FFFB0', fontSize: 32, fontWeight: '700', marginTop: 4 },
  syncMsg: { color: '#8892A4', fontSize: 12, marginTop: 8, textAlign: 'center' },
  button: { width: '100%', padding: 18, borderRadius: 14, alignItems: 'center', marginBottom: 14 },
  primaryButton: { backgroundColor: '#2563EB' },
  secondaryButton: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  syncButton: { backgroundColor: '#0F4C2A' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' }
});