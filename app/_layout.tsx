import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#424242', // Dark Grey
    onPrimary: '#FFFFFF',
    primaryContainer: '#E0E0E0', // Light Grey
    onPrimaryContainer: '#1A1A1A',
    secondary: '#757575',
    secondaryContainer: '#F5F5F5',
    onSecondaryContainer: '#1A1A1A',
    tertiary: '#616161',
    outline: '#9E9E9E',
    surfaceVariant: '#EEEEEE',
    onSurfaceVariant: '#424242',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  const [loaded] = useFonts({
    'NicoMoji': require('../assets/fonts/NicoMoji-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);



  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );

}
