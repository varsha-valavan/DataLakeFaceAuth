import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { AuthScreen } from '../screens/AuthScreen';

import { DatabaseService } from '../services/DatabaseService';
import { FaceRecognitionService } from '../services/FaceRecognitionService';
import { SyncService } from '../services/SyncService';

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
      // Initialize database
      await db.initialize();
      console.log('Database initialized');

      // Initialize AI service (safe mode)
      try {
        await recognitionService.initialize();
      } catch (modelErr) {
        console.warn('Models not loaded (simulation mode):', modelErr);
      }

      // Start sync service
      syncService.startWatching();

      setIsReady(true);
    } catch (err: any) {
      setError(err.message || 'Initialization failed');
    }
  };

  // ❌ ERROR SCREEN
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0E1A',
        }}
      >
        <Text style={{ color: 'red', textAlign: 'center', padding: 20 }}>
          Initialization failed: {error}
        </Text>
      </View>
    );
  }

  // ⏳ LOADING SCREEN
  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0E1A',
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ color: '#8892A4', marginTop: 16 }}>
          Loading system...
        </Text>
      </View>
    );
  }

  // 🚀 MAIN APP NAVIGATION
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* HOME SCREEN */}
        <Stack.Screen name="Home">
          {(props) => (
            <HomeScreen
              {...props}
              db={db}
              syncService={syncService}
            />
          )}
        </Stack.Screen>

        {/* AUTH SCREEN */}
        <Stack.Screen name="Auth">
          {(props) => (
            <AuthScreen
              {...props}
              recognitionService={recognitionService}
              db={db}
            />
          )}
        </Stack.Screen>

      </Stack.Navigator>
    </NavigationContainer>
  );
};