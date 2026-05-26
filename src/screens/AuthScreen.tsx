import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Vibration, Alert
} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { FaceRecognitionService } from '../services/FaceRecognitionService';
import { LivenessChallengeService } from '../services/LivenessChallengeService';
import { DatabaseService } from '../services/DatabaseService';
import { PermissionHelper } from '../utils/PermissionHelper';
import Geolocation from '@react-native-community/geolocation';
import { ChallengeType } from '../types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const CHALLENGE_LABELS: Record<ChallengeType, string> = {
  blink:      '👁  Blink twice',
  smile:      '😊  Smile please',
  turn_left:  '⬅️  Turn head left',
  turn_right: '➡️  Turn head right',
};

type AuthStage = 'requesting_permission' | 'challenge' | 'processing' | 'success' | 'failed';

interface Props {
  navigation: any;
  recognitionService: FaceRecognitionService;
  db: DatabaseService;
}

export const AuthScreen: React.FC<Props> = ({ navigation, recognitionService, db }) => {
  const [stage, setStage] = useState<AuthStage>('requesting_permission');
  const [challenges, setChallenges] = useState<ChallengeType[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<ChallengeType[]>([]);
  const [message, setMessage] = useState('Initializing...');
  const [resultData, setResultData] = useState<any>(null);

  const livenessService = useRef(new LivenessChallengeService()).current;
  const devices = useCameraDevices();
  const frontCamera = devices.find(d => d.position === 'front');

  useEffect(() => {
    setup();
  }, []);

  const setup = async () => {
    const granted = await PermissionHelper.requestAll();
    if (!granted) {
      Alert.alert('Permission Required', 'Camera permission is needed for authentication.');
      navigation.goBack();
      return;
    }
    const newChallenges = livenessService.generateChallenges();
    setChallenges(newChallenges);
    setStage('challenge');
    setMessage(CHALLENGE_LABELS[newChallenges[0]]);
  };

  const handleAuthComplete = async (pixelData: Uint8Array, w: number, h: number) => {
    setStage('processing');
    setMessage('Verifying identity...');

    try {
      const enrolledFaces = await db.getAllEnrolledFaces();
      const result = await recognitionService.authenticate(pixelData, w, h, enrolledFaces);

      // Get GPS location
      Geolocation.getCurrentPosition(
        async (position) => {
          await db.logAuthAttempt({
            id: uuidv4(),
            employeeId: result.employeeId || 'UNKNOWN',
            timestamp: Date.now(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            passed: result.passed,
            confidenceScore: result.confidenceScore,
            livenessScore: result.livenessScore
          });
        },
        async () => {
          // GPS failed — log without location
          await db.logAuthAttempt({
            id: uuidv4(),
            employeeId: result.employeeId || 'UNKNOWN',
            timestamp: Date.now(),
            latitude: 0,
            longitude: 0,
            passed: result.passed,
            confidenceScore: result.confidenceScore,
            livenessScore: result.livenessScore
          });
        }
      );

      setResultData(result);
      if (result.passed) {
        Vibration.vibrate([0, 200, 100, 200]);
        setStage('success');
        setMessage(`Welcome, ${result.employeeName}!`);
      } else {
        Vibration.vibrate(500);
        setStage('failed');
        setMessage(
          result.livenessScore < 0.70
            ? 'Liveness check failed. Please use a real face.'
            : 'Face not recognized. Please try again.'
        );
      }
    } catch (error) {
      setStage('failed');
      setMessage('Authentication error. Try again.');
    }
  };

  const handleChallengeComplete = (completed: ChallengeType) => {
    const updated = [...completedChallenges, completed];
    setCompletedChallenges(updated);

    const next = challenges.find(c => !updated.includes(c));
    if (next) {
      setMessage(CHALLENGE_LABELS[next]);
    } else {
      setMessage('Hold still...');
      // All challenges done — trigger recognition
      // In real implementation this gets the actual frame pixels
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {frontCamera && (stage === 'challenge' || stage === 'processing') && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={frontCamera}
          isActive={true}
          photo={true}
        />
      )}

      <View style={styles.overlay}>
        {/* Face oval guide */}
        <View style={styles.faceOval} />

        {/* Challenge list */}
        {stage === 'challenge' && (
          <View style={styles.challengeContainer}>
            {challenges.map(c => (
              <View key={c} style={styles.challengeRow}>
                <Text style={styles.challengeCheck}>
                  {completedChallenges.includes(c) ? '✅' : '⬜'}
                </Text>
                <Text style={[
                  styles.challengeLabel,
                  completedChallenges.includes(c) && styles.challengeDone
                ]}>
                  {CHALLENGE_LABELS[c]}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Status message */}
        <View style={[
          styles.statusBar,
          stage === 'success' && styles.successBar,
          stage === 'failed' && styles.failedBar,
        ]}>
          <Text style={styles.statusText}>{message}</Text>
          {resultData && stage !== 'challenge' && (
            <Text style={styles.scoreText}>
              Confidence: {(resultData.confidenceScore * 100).toFixed(1)}% | 
              Liveness: {(resultData.livenessScore * 100).toFixed(1)}%
            </Text>
          )}
        </View>

        {(stage === 'success' || stage === 'failed') && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              const newChallenges = livenessService.generateChallenges();
              setChallenges(newChallenges);
              setCompletedChallenges([]);
              setResultData(null);
              setStage('challenge');
              setMessage(CHALLENGE_LABELS[newChallenges[0]]);
            }}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  faceOval: { width: 240, height: 300, borderRadius: 120, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)', borderStyle: 'dashed' },
  challengeContainer: { backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 16, padding: 16, width: '100%' },
  challengeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  challengeCheck: { fontSize: 18, marginRight: 10 },
  challengeLabel: { color: '#FFFFFF', fontSize: 16 },
  challengeDone: { color: '#4FFFB0', textDecorationLine: 'line-through' },
  statusBar: { width: '100%', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 14, padding: 16, alignItems: 'center' },
  successBar: { backgroundColor: 'rgba(16,185,129,0.85)' },
  failedBar: { backgroundColor: 'rgba(239,68,68,0.85)' },
  statusText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600', textAlign: 'center' },
  scoreText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 },
  retryButton: { backgroundColor: '#1E293B', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  retryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }
});