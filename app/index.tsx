import { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';


export default function SplashScreen() {
    const router = useRouter();
    const { token, isLoading } = useAuth();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const requestPermissions = async () => {
        try {
            // Request Location
            await Location.requestForegroundPermissionsAsync();

            // Request Microphone
            await Audio.requestPermissionsAsync();

            // Request Notifications - Handle Expo Go SDK 53+ limitations gracefully
            try {
                // Defer requiring notifications to avoid global side-effects on import
                const Notifications = require('expo-notifications');
                if (Notifications && typeof Notifications.requestPermissionsAsync === 'function') {
                    await Notifications.requestPermissionsAsync();
                }
            } catch (notifyError) {
                console.warn('Notifications permission skip (likely Expo Go):', notifyError);
            }
        } catch (error) {
            console.error('Error requesting permissions:', error);
        }
    };

    useEffect(() => {
        requestPermissions();

        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Navigate after 3 seconds to give time for permissions and branding
        if (!isLoading) {
            const timer = setTimeout(() => {
                if (token) {
                    router.replace('/(tabs)');
                } else {
                    router.replace('/(auth)/login');
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isLoading, token]);


    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <Animated.Text style={[styles.logo, { opacity: fadeAnim }]}>
                Sunside
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        fontSize: 48,
        color: '#FFFFFF',
        letterSpacing: 2,
        fontFamily: 'NicoMoji',
    },
});
