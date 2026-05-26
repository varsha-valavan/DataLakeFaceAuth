import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { DatabaseService } from '../services/DatabaseService';
import { FaceRecognitionService } from '../services/FaceRecognitionService';
import { SyncService } from '../services/SyncService';
import { View, Text, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const db = useRef(new DatabaseService()).current;
  const recognitionService = useRef(new FaceRecognitionService()).current;
  const syncService = useRef(new SyncService(db)).current;

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await db.initialize();
      try {
        await recognitionService.initialize();
      } catch (modelErr) {
        console.warn('Models not loaded (expected in dev):', modelErr);
      }
      syncService.startWatching();
      setIsReady(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0E1A' }}>
        <Text style={{ color: 'red', textAlign: 'center', padding: 20 }}>
          Initialization failed: {error}
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0E1A' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ color: '#8892A4', marginTop: 16 }}>Loading AI models...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home">
          {(props) => <HomeScreen {...props} db={db} syncService={syncService} />}
        </Stack.Screen>
        <Stack.Screen name="Auth">
          {(props) => <AuthScreen {...props} recognitionService={recognitionService} db={db} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};