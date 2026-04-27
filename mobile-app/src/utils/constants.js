import { Platform } from 'react-native';
import { resolveApiBaseUrl } from './apiUrl';

const loadExpoConstants = () => {
  try {
    return require('expo-constants').default;
  } catch (error) {
    try {
      return require('expo/node_modules/expo-constants').default;
    } catch (nestedError) {
      return null;
    }
  }
};

const expoConstants = loadExpoConstants();
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const BASE_URL = resolveApiBaseUrl({
  envUrl: process.env.EXPO_PUBLIC_API_URL,
  expoHostUri: expoConstants?.expoConfig?.hostUri,
  expoDebuggerHost:
    expoConstants?.expoGoConfig?.debuggerHost ||
    expoConstants?.manifest2?.extra?.expoGo?.debuggerHost,
  fallbackHost,
});
