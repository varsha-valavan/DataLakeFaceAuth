import { PermissionsAndroid, Platform, Alert } from 'react-native';

export class PermissionHelper {
  static async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return true; // iOS handles via Info.plist
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Required',
          message: 'DataLake needs camera access for face authentication.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Camera permission error:', err);
      return false;
    }
  }

  static async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'DataLake needs location to tag attendance records.',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
        buttonNeutral: 'Ask Me Later',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  static async requestAll(): Promise<boolean> {
    const camera = await this.requestCameraPermission();
    const location = await this.requestLocationPermission();
    return camera && location;
  }
}