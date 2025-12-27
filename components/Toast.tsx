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
    message: string;
    type: ToastType;
    visible: boolean;
    onHide: () => void;
}

const Toast = ({ message, type, visible, onHide }: ToastProps) => {
    const { width } = useWindowDimensions();
    const translateY = useSharedValue(-150);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(60, { damping: 12, stiffness: 120 });
            opacity.value = withTiming(1, { duration: 150 });

            const timer = setTimeout(() => {
                hide();
            }, 2500);

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
                    color: '#4CAF50',
                    icon: 'checkmark',
                    title: 'Success'
                };
            case 'error':
                return {
                    color: '#FF4B5C',
                    icon: 'close',
                    title: 'Error'
                };
            case 'info':
                return {
                    color: '#2196F3',
                    icon: 'information',
                    title: 'Info'
                };
            case 'warning':
                return {
                    color: '#FFB74D',
                    icon: 'alert',
                    title: 'Warning'
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
            <View style={[styles.sideStripe, { backgroundColor: config.color }]} />

            <View style={styles.contentContainer}>
                <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
                    <Ionicons name={config.icon as any} size={20} color="#FFF" />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{config.title}</Text>
                    <Text style={styles.message} numberOfLines={2}>
                        {message}
                    </Text>
                </View>

                <TouchableOpacity onPress={hide} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color="#999" />
                </TouchableOpacity>
            </View>
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
        borderRadius: 12,
        flexDirection: 'row',
        zIndex: 9999,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    sideStripe: {
        width: 6,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 12,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    message: {
        color: '#666',
        fontSize: 13,
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});


export default Toast;
