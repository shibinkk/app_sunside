import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { API_URL } from '../../constants/Config';
import { ActivityIndicator } from 'react-native';
import { useToast } from '../../context/ToastContext';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { height: screenHeight } = useWindowDimensions();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string }>({});

    const handleNext = async () => {
        if (!email.trim()) {
            setErrors({ email: 'Email is required' });
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setErrors({ email: 'Invalid email format' });
            return;
        }
        setErrors({});
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/send-reset-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                showToast(data.message, 'success');
                router.push({
                    pathname: '/(auth)/forgot-verification',
                    params: { email }
                });
            } else {
                showToast(data.message || 'An error occurred', 'error');
            }
        } catch (error) {
            console.error('Forgot Password Error:', error);
            showToast('Could not connect to the server', 'error');
        } finally {
            setIsLoading(false);
        }
    };


    const responsiveMargin = screenHeight < 700 ? 15 : 30;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAwareScrollView
                contentContainerStyle={styles.contentContainer}
                enableOnAndroid
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ILLUSTRATION */}
                <View
                    style={[
                        styles.logoContainer,
                        { marginBottom: responsiveMargin, marginTop: screenHeight < 700 ? -20 : 0 },
                    ]}
                >
                    <Image
                        source={require('../../assets/images/forgot.png')}
                        style={{
                            width: screenHeight < 700 ? 220 : 400,
                            height: screenHeight < 700 ? 170 : 240,
                        }}
                        contentFit="contain"
                    />
                </View>

                {/* HEADER */}
                <View style={[styles.headerContainer, { marginBottom: responsiveMargin }]}>
                    <Text style={styles.title}>Forgot Password</Text>
                    <Text style={styles.subtitle}>Please enter your registered email</Text>
                </View>

                {/* FORM */}
                <View style={styles.formContainer}>
                    <View
                        style={[
                            styles.inputContainer,
                            errors.email ? styles.inputError : null,
                            { marginBottom: errors.email ? 8 : 24 },
                        ]}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errors.email) setErrors({});
                            }}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Ionicons name="mail-outline" size={20} color={errors.email ? '#FF3B30' : '#999'} />
                    </View>
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    <TouchableOpacity
                        style={[styles.nextButton, isLoading && { opacity: 0.7 }]}
                        onPress={handleNext}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>Next</Text>
                                <Ionicons name="chevron-forward" size={20} color="#FFF" style={{ marginLeft: 4 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Back to Login ? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.footerLink}>Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAwareScrollView>
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
    },
    headerContainer: {
        width: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: '#000',
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF9F9',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginBottom: 16,
        marginLeft: 4,
        fontWeight: '500',
    },
    nextButton: {
        backgroundColor: '#000',
        borderRadius: 12,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    nextButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#666',
    },
    footerLink: {
        fontSize: 14,
        color: '#FF3951',
        fontWeight: '700',
    },
});
