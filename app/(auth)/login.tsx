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
import { API_URL } from '../../constants/Config';
import { ActivityIndicator } from 'react-native';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { signIn } = useAuth();
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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await signIn(data.token, data.user);
        showToast('Login successful!', 'success');
        router.replace('/(tabs)');
      } else {
        showToast(data.message || 'Invalid email or password', 'error');
      }

    } catch (error) {
      console.error('Login Error:', error);
      showToast('Could not connect to the server', 'error');
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
            { marginBottom: responsiveMargin, marginTop: screenHeight < 700 ? -20 : 0 },
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
        <View style={[styles.headerContainer, { marginBottom: headerMargin }]}>
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
              <>
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFFFFF" style={{ marginTop: 3 }} />
              </>
            )}
          </TouchableOpacity>

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
    paddingTop: 60,
    paddingBottom: 60,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  headerContainer: {
    marginBottom: 40,
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
    marginBottom: 40,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
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
    marginTop: 8,
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
    fontWeight: '600',
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
});
