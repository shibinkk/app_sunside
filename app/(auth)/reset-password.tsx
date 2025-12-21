import { useState } from 'react';
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

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { height: screenHeight } = useWindowDimensions();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

    const handleReset = () => {
        const newErrors: typeof errors = {};

        if (!password.trim()) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        if (!confirmPassword.trim()) newErrors.confirmPassword = 'Confirm password is required';
        else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        // Success logic here
        router.replace('/(auth)/login');
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
                        source={require('../../assets/images/reset.png')}
                        style={{
                            width: screenHeight < 700 ? 220 : 400,
                            height: screenHeight < 700 ? 170 : 240,
                        }}
                        contentFit="contain"
                    />
                </View>

                {/* HEADER */}
                <View style={[styles.headerContainer, { marginBottom: responsiveMargin }]}>
                    <Text style={styles.title}>Create New Password</Text>
                    <Text style={styles.subtitle}>create a new unique password</Text>
                </View>

                {/* FORM */}
                <View style={styles.formContainer}>
                    {/* New Password */}
                    <View
                        style={[
                            styles.inputContainer,
                            errors.password ? styles.inputError : null,
                            { marginBottom: errors.password ? 8 : 16 },
                        ]}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Enter new password"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                            }}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                        />
                        <Pressable onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color={errors.password ? '#FF3B30' : '#999'}
                            />
                        </Pressable>
                    </View>
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    {/* Confirm Password */}
                    <View
                        style={[
                            styles.inputContainer,
                            errors.confirmPassword ? styles.inputError : null,
                            { marginBottom: errors.confirmPassword ? 8 : 24 },
                        ]}
                    >
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm new password"
                            placeholderTextColor="#999"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                            }}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                        />
                        <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons
                                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                size={20}
                                color={errors.confirmPassword ? '#FF3B30' : '#999'}
                            />
                        </Pressable>
                    </View>
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                        <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
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
        marginBottom: 8,
        marginLeft: 4,
        fontWeight: '500',
    },
    resetButton: {
        backgroundColor: '#000',
        borderRadius: 12,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
