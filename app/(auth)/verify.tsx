import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useToast } from '../../context/ToastContext';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../../context/AuthContext';

export default function VerifyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { height: screenHeight } = useWindowDimensions();


    const [code, setCode] = useState(['', '', '', '', '', '']); // Changed to 6 digits
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [timer, setTimer] = useState(30);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const responsiveMargin = screenHeight < 700 ? 10 : 20;

    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 5) { // Updated for 6 digits
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otp = code.join('');
        if (otp.length < 6) {
            showToast('Please enter the 6-digit code', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/verify-register-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: params.name,
                    email: params.email,
                    password: params.password,
                    phoneNumber: params.phoneNumber,
                    otp: otp
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // OTP verified by backend, now create user in Firebase
                try {
                    const { signUp: firebaseSignUp } = require('../../config/authHelper');
                    // We need to pass the password from params
                    await firebaseSignUp(params.email as string, params.password as string, params.name as string);

                    showToast('Registration successful!', 'success');
                    router.replace('/(tabs)');
                } catch (firebaseError: any) {
                    console.error('Firebase Registration Error:', firebaseError);
                    showToast(firebaseError.message || 'Error creating Firebase account', 'error');
                }
            } else {
                showToast(data.message || 'Verification failed', 'error');
            }

        } catch (error) {
            console.error('Verification Error:', error);
            showToast('Could not connect to the server', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;

        setIsResending(true);
        try {
            const response = await fetch(`${API_URL}/auth/send-register-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: params.email,
                    name: params.name
                }),

            });

            const data = await response.json();

            if (response.ok) {
                showToast('New OTP sent!', 'success');
                setTimer(30);
            } else {
                showToast(data.message || 'Failed to resend OTP', 'error');
            }
        } catch (error) {
            console.error('Resend Error:', error);
            showToast('Could not connect to the server', 'error');
        } finally {
            setIsResending(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <KeyboardAwareScrollView
                contentContainerStyle={styles.contentContainer}
                enableOnAndroid
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* LOGO */}
                <View
                    style={[
                        styles.logoContainer,
                        { marginBottom: responsiveMargin, marginTop: screenHeight < 700 ? -20 : 0 },
                    ]}
                >
                    <Image
                        source={require('../../assets/images/verification.png')}
                        style={{
                            width: screenHeight < 700 ? 200 : 400,
                            height: screenHeight < 700 ? 160 : 240,
                        }}
                        contentFit="contain"
                    />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Almost there</Text>

                    <Text style={styles.subtitle}>
                        Please enter the 6-digit code sent to your email{' '}
                        <Text style={styles.email}>{params.email || 'your email'}</Text> for verification.
                    </Text>

                    <View style={styles.codeContainer}>
                        {code.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={styles.codeInput}
                                value={digit}
                                onChangeText={(text) => handleCodeChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.verifyButton, isLoading && { opacity: 0.7 }]}
                        onPress={handleVerify}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.verifyButtonText}>Verify</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive any code? </Text>
                        <TouchableOpacity onPress={handleResend} disabled={timer > 0 || isResending}>
                            <Text style={[styles.resendLink, (timer > 0 || isResending) && { color: '#CCC' }]}>
                                {isResending ? 'Resending...' : 'Resend Again'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {timer > 0 && <Text style={styles.timerText}>Request a new code in 00:{timer < 10 ? `0${timer}` : timer}s</Text>}
                </View>
            </KeyboardAwareScrollView>


            <TouchableOpacity style={styles.backButtonCircle} onPress={handleGoBack}>
                <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 40,
    },
    email: {
        color: '#FF3951',
        fontWeight: '600',
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 40,
    },
    codeInput: {
        width: 48,
        height: 52,
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#000000',
        fontSize: 22,
        fontWeight: '600',
        textAlign: 'center',
        color: '#1a1a1a',
    },

    verifyButton: {
        backgroundColor: '#000000',
        borderRadius: 12,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'NicoMoji',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    resendText: {
        color: '#666',
        fontSize: 14,
    },
    resendLink: {
        color: '#1a1a1a',
        fontSize: 14,
        fontWeight: '600',
    },
    timerText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 13,
    },
    backButtonCircle: {
        position: 'absolute',
        bottom: 30,
        left: 24,
        width: 50,
        height: 50,
        backgroundColor: '#000000',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
});
