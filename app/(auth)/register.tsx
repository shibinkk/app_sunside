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
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CountryPickerModal from '@/components/CountryPickerModal';
import { Image } from 'expo-image';
import { parsePhoneNumberFromString } from 'libphonenumber-js/mobile';
import countriesData from '../../constants/countries.json';
import { API_URL } from '../../constants/Config';
import { ActivityIndicator } from 'react-native';
import { useToast } from '../../context/ToastContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { height: screenHeight } = useWindowDimensions();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('+91');
  const [countryFlag, setCountryFlag] = useState('https://flagcdn.com/w320/in.png');
  const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    terms?: string;
  }>({});

  const handleRegister = async () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Invalid email format';

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneNumber = parsePhoneNumberFromString(phone, countryCode as any);
      if (!phoneNumber || !phoneNumber.isValid()) {
        newErrors.phone = `Invalid number for ${countryCode}`;
      }
    }

    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!agreedToTerms) newErrors.terms = 'You must agree to the terms';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/send-register-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          name: fullName
        }),

      });

      const data = await response.json();

      if (response.ok) {
        showToast('OTP sent to your email!', 'success');
        router.push({
          pathname: '/(auth)/verify',
          params: {
            name: fullName,
            email: email,
            password: password,
            phoneNumber: `${callingCode}${phone}`,
          }
        });
      } else {
        showToast(data.message || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('OTP Send Error:', error);
      showToast('Could not connect to the server', 'error');
    } finally {
      setIsLoading(false);
    }
  };



  const responsiveMargin = screenHeight < 700 ? 10 : 20;
  const headerMargin = screenHeight < 700 ? 15 : 30;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar style="dark" />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid
        extraScrollHeight={20}
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
            source={require('../../assets/images/register.png')}
            style={{
              width: screenHeight < 700 ? 200 : 400,
              height: screenHeight < 700 ? 160 : 240,
            }}
            contentFit="contain"
          />
        </View>

        {/* HEADER */}
        <View style={[styles.headerContainer, { marginBottom: headerMargin }]}>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>by creating a free account.</Text>
        </View>

        {/* FORM */}
        <View style={[styles.formContainer, { marginBottom: responsiveMargin }]}>
          <View
            style={[
              styles.inputContainer,
              errors.fullName ? styles.inputError : null,
              { marginBottom: errors.fullName ? 8 : 16 },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              autoCapitalize="words"
            />
            <Ionicons name="person-outline" size={20} color={errors.fullName ? '#FF3B30' : '#000'} />
          </View>
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          <View
            style={[
              styles.inputContainer,
              errors.email ? styles.inputError : null,
              { marginBottom: errors.email ? 8 : 16 },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Valid email"
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
              errors.phone ? styles.inputError : null,
              { marginBottom: errors.phone ? 8 : 16 },
            ]}
          >
            <TouchableOpacity
              style={styles.countryPickerButton}
              onPress={() => setIsCountryPickerVisible(true)}
            >
              <Image source={{ uri: countryFlag }} style={styles.flagIcon} />
              <Text style={styles.callingCodeText}>{callingCode}</Text>
              <Ionicons name="chevron-down" size={12} color="#999" style={{ marginLeft: 4, marginRight: 8, marginTop: 3 }} />
            </TouchableOpacity>

            <CountryPickerModal
              visible={isCountryPickerVisible}
              onClose={() => setIsCountryPickerVisible(false)}
              onSelect={(country) => {
                setCountryCode(country.code);
                setCallingCode(country.dial_code);
                setCountryFlag(country.flag);
              }}
            />

            <View style={styles.phoneDivider} />

            <TextInput
              style={styles.input}
              placeholder="Phone number"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              keyboardType="phone-pad"
            />
            <Ionicons name="call-outline" size={20} color={errors.phone ? '#FF3B30' : '#000'} />
          </View>
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          <View
            style={[
              styles.inputContainer,
              errors.password ? styles.inputError : null,
              { marginBottom: errors.password ? 8 : 16 },
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Strong password"
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

          {/* TERMS */}
          <View style={styles.checkboxWrapper}>
            <View style={styles.checkboxContainer}>
              <Pressable
                style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxChecked,
                  errors.terms ? styles.checkboxError : null,
                ]}
                onPress={() => {
                  setAgreedToTerms(!agreedToTerms);
                  if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }));
                }}
              >
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>

              <Text style={styles.termsText}>
                By checking the box you agree to our{' '}
                <Text style={styles.termsLink}>Terms</Text> and{' '}
                <Text style={styles.termsLink}>Conditions</Text>.
              </Text>
            </View>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
          </View>
        </View>

        {/* BUTTONS */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
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

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already a member? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Login in</Text>
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
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 30,
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
    marginBottom: 30,
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
  flagIcon: {
    width: 24,
    height: 16,
    borderRadius: 2,
    marginRight: 6,
  },
  callingCodeText: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  countryPickerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EEE',
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxError: {
    borderColor: '#FF3B30',
  },
  checkboxWrapper: {
    marginTop: 8,
  },
  checkboxChecked: {
    backgroundColor: '#FF3951',
    borderColor: '#FF3951',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  termsLink: {
    color: '#FF3951',
    fontWeight: '600',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF3951',
    fontSize: 14,
    fontWeight: '600',
  },
});
