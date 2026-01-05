import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    title?: string;
    message: string;
    type: ToastType;
    visible: boolean;
    onHide: () => void;
}

const Toast = ({ title, message, type, visible, onHide }: ToastProps) => {
    const { width } = useWindowDimensions();
    const translateY = useSharedValue(-150);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(60, { damping: 15, stiffness: 120 });
            opacity.value = withTiming(1, { duration: 200 });

            const timer = setTimeout(() => {
                hide();
            }, 3500);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hide = () => {
        translateY.value = withTiming(-150, { duration: 300 }, () => {
            runOnJS(onHide)();
        });
        opacity.value = withTiming(0, { duration: 300 });
    };

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            opacity: opacity.value,
        };
    });

    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    color: '#00D084',
                    icon: 'checkmark-circle',
                    title: 'Saved Successfully'
                };
            case 'error':
                return {
                    color: '#FF4B5C',
                    icon: 'close-circle',
                    title: 'Error Occurred'
                };
            case 'info':
                return {
                    color: '#2196F3',
                    icon: 'information-circle',
                    title: 'Information'
                };
            case 'warning':
                return {
                    color: '#FFB100',
                    icon: 'alert-circle',
                    title: 'Action Required'
                };

            default:
                return {
                    color: '#333',
                    icon: 'information-circle',
                    title: 'Notification'
                };
        }
    };

    const config = getConfig();

    if (!visible && opacity.value === 0) return null;

    return (
        <Animated.View style={[styles.container, { width: width - 32 }, animatedStyle]}>
            <View style={styles.contentContainer}>
                <View style={[styles.iconContainer, { backgroundColor: `${config.color}33` }]}>
                    <Ionicons name={config.icon as any} size={24} color={config.color} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title || config.title}</Text>
                    <Text style={styles.message}>
                        {message}
                    </Text>
                </View>
            </View>

            {/* Glow / Bottom border effect */}
            <View style={[styles.bottomGlow, { backgroundColor: config.color, shadowColor: config.color }]} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        zIndex: 9999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1C1E',
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    message: {
        color: '#64748B',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    bottomGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        opacity: 0.9,
    },
});


export default Toast;
