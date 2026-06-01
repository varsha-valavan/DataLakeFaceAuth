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
  blink: '👁 Blink twice',
  smile: '😊 Smile please',
  turn_left: '⬅️ Turn head left',
  turn_right: '➡️ Turn head right',
};

type AuthStage = 'requesting_permission' | 'challenge' | 'processing' | 'success' | 'failed';

interface Props {
  navigation: any;
  recognitionService: FaceRecognitionService;
  db: DatabaseService;
}

export const AuthScreen: React.FC<Props> = ({
  navigation,
  recognitionService,
  db
}) => {

  const [stage, setStage] = useState<AuthStage>('requesting_permission');
  const [challenges, setChallenges] = useState<ChallengeType[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<ChallengeType[]>([]);
  const [message, setMessage] = useState('Initializing...');
  const [resultData, setResultData] = useState<any>(null);

  const processingRef = useRef(false);
  const livenessService = useRef(new LivenessChallengeService()).current;

  const devices = useCameraDevices();
  const frontCamera = devices.find(d => d.position === 'front');

  useEffect(() => {
    setup();
  }, []);

  const setup = async () => {
    const granted = await PermissionHelper.requestAll();

    if (!granted) {
      Alert.alert('Permission Required', 'Camera permission needed');
      navigation.goBack();
      return;
    }

    resetFlow();
  };

  const resetFlow = () => {
    const newChallenges = livenessService.generateChallenges();

    setChallenges(newChallenges);
    setCompletedChallenges([]);
    setResultData(null);
    setStage('challenge');
    setMessage(CHALLENGE_LABELS[newChallenges[0]]);
  };

  const logAuth = async (result: any) => {
    try {
      Geolocation.getCurrentPosition(
        async (pos) => {
          await db.logAuthAttempt({
            id: uuidv4(),
            employeeId: result.employeeId || 'UNKNOWN',
            timestamp: Date.now(),
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            passed: result.passed,
            confidenceScore: result.confidenceScore,
            livenessScore: result.livenessScore
          });
        },
        async () => {
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
    } catch (e) {}
  };

  const handleAuthComplete = async (pixelData: Uint8Array, w: number, h: number) => {

    if (processingRef.current) return;
    processingRef.current = true;

    setStage('processing');
    setMessage('Verifying identity...');

    try {
      const enrolledFaces = await db.getAllEnrolledFaces();

      const result = await recognitionService.authenticate(
        pixelData,
        w,
        h,
        enrolledFaces
      );

      setResultData(result);
      await logAuth(result);

      if (result.passed) {
        Vibration.vibrate([0, 200, 100, 200]);
        setStage('success');
        setMessage(`Welcome, ${result.employeeName || 'User'}!`);
      } else {
        Vibration.vibrate(500);
        setStage('failed');
        setMessage(
          result.livenessScore < 0.7
            ? 'Liveness failed'
            : 'Face not recognized'
        );
      }

    } catch (err) {
      setStage('failed');
      setMessage('Authentication error');
    }

    setTimeout(() => {
      processingRef.current = false;
    }, 2000);
  };

  const handleChallengeComplete = (completed: ChallengeType) => {
    const updated = [...completedChallenges, completed];
    setCompletedChallenges(updated);

    const next = challenges.find(c => !updated.includes(c));

    if (next) {
      setMessage(CHALLENGE_LABELS[next]);
    } else {
      setMessage('Hold still...');
      // IMPORTANT: connect real camera frame later
    }
  };

  const retry = () => {
    resetFlow();
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* CAMERA */}
      {frontCamera && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={frontCamera}
          isActive={stage === 'challenge' || stage === 'processing'}
          photo={true}
        />
      )}

      <View style={styles.overlay}>

        <View style={styles.faceOval} />

        {/* CHALLENGES */}
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

        {/* STATUS */}
        <View style={[
          styles.statusBar,
          stage === 'success' && styles.successBar,
          stage === 'failed' && styles.failedBar,
        ]}>
          <Text style={styles.statusText}>{message}</Text>

          {resultData && (
            <Text style={styles.scoreText}>
              Confidence: {(resultData.confidenceScore * 100).toFixed(1)}% |{" "}
              Liveness: {(resultData.livenessScore * 100).toFixed(1)}%
            </Text>
          )}
        </View>

        {/* RETRY BUTTON (FIXED TOUCH) */}
        {(stage === 'failed' || stage === 'success') && (
          <TouchableOpacity style={styles.retryButton} onPress={retry}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60
  },

  faceOval: {
    width: 240,
    height: 300,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    borderStyle: 'dashed'
  },

  challengeContainer: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 16,
    padding: 16,
    width: '100%'
  },

  challengeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  challengeCheck: { fontSize: 18, marginRight: 10 },
  challengeLabel: { color: '#fff', fontSize: 16 },
  challengeDone: { color: '#4FFFB0', textDecorationLine: 'line-through' },

  statusBar: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center'
  },

  successBar: { backgroundColor: 'rgba(16,185,129,0.85)' },
  failedBar: { backgroundColor: 'rgba(239,68,68,0.85)' },

  statusText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center'
  },

  scoreText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4
  },

  retryButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 30
  },

  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  }
});