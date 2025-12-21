import { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen() {
    const router = useRouter();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Navigate to login after 2.5 seconds
        const timer = setTimeout(() => {
            router.replace('/(auth)/login');
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

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
