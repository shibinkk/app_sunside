import { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Pressable,
    useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function VerifyScreen() {
    const router = useRouter();
    const { height: screenHeight } = useWindowDimensions();
    const [code, setCode] = useState(['', '', '', '', '']);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const responsiveMargin = screenHeight < 700 ? 10 : 20;

    const handleCodeChange = (text: string, index: number) => {
        const newCode = [...code];
        newCode[index] = text;
        setCode(newCode);

        // Auto-focus next input
        if (text && index < 4) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        // Add your verification logic here
        router.replace('/(tabs)');
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
                        Please enter the 5-digit code sent to your email{' '}
                        <Text style={styles.email}>contact.uiuxexperts@gmail.com</Text> for verification.
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

                    <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
                        <Text style={styles.verifyButtonText}>Verify</Text>
                    </TouchableOpacity>

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive any code? </Text>
                        <TouchableOpacity>
                            <Text style={styles.resendLink}>Resend Again</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.timerText}>Request a new code in 00:30s</Text>
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
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    codeInput: {
        width: 56,
        height: 56,
        backgroundColor: 'transparent',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#000000',
        fontSize: 24,
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
        fontWeight: '600',
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
