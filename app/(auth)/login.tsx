import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ActivityIndicator } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { height: screenHeight } = useWindowDimensions();


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { signIn: firebaseSignIn } = require('../../config/authHelper');
      await firebaseSignIn(email, password);

      showToast('Login successful!', 'success');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login Error:', error);
      let message = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') message = 'No user found with this email';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password';
      if (error.code === 'auth/network-request-failed') message = 'Network error. Check your connection';

      showToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const responsiveMargin = screenHeight < 700 ? 15 : 30;
  const headerMargin = screenHeight < 700 ? 20 : 40;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <View
          style={[
            styles.logoContainer,
            { marginBottom: 15, marginTop: screenHeight < 700 ? -35 : -20 },
          ]}
        >
          <Image
            source={require('../../assets/images/login-illustration.png')}
            style={{
              width: screenHeight < 700 ? 220 : 400,
              height: screenHeight < 700 ? 170 : 240,
            }}
            contentFit="contain"
          />
        </View>

        {/* HEADER */}
        <View style={[styles.headerContainer, { marginBottom: 35 }]}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>sign in to access your account</Text>
        </View>

        {/* FORM */}
        <View style={[styles.formContainer, { marginBottom: responsiveMargin }]}>
          <View
            style={[
              styles.inputContainer,
              errors.email ? styles.inputError : null,
              { marginBottom: errors.email ? 8 : 16 },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Ionicons name="mail-outline" size={20} color={errors.email ? '#FF3B30' : '#000'} />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          <View
            style={[
              styles.inputContainer,
              errors.password ? styles.inputError : null,
              { marginBottom: errors.password ? 8 : 16 },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={errors.password ? '#FF3B30' : '#000'}
              />
            </Pressable>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotPassword}>Forget password ?</Text>
          </TouchableOpacity>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.nextButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => {/* Google login logic placeholder */ }}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>New member ? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Register now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40, // Reduced from 60
    paddingBottom: 60,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  headerContainer: {
    marginBottom: 35,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    marginBottom: 40,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    height: 56,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#666',
    fontSize: 13,
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 'auto',
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
    fontFamily: 'NicoMoji',
    marginRight: 6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: '#666',
    fontSize: 14,
  },
  registerLink: {
    color: '#FF3951',
    fontSize: 14,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8, // Reduced from 30
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 10, // Reduced from 40
  },
  socialButton: {
    width: 48, // Reduced from 60
    height: 48, // Reduced from 60
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
});
