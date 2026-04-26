import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated, StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  getRegisterValidationErrors,
  normalizeEmail,
  normalizeName,
  normalizePassword,
} from '../../utils/validators';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const updateFieldError = (field, nextValues) => {
    if (!touched[field] && !errors[field]) {
      return;
    }

    const nextErrors = getRegisterValidationErrors(nextValues);
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const handleNameChange = (value) => {
    setName(value);
    updateFieldError('name', { name: value, email, password, confirmPassword });
  };

  const handleEmailChange = (value) => {
    setEmail(value);
    updateFieldError('email', { name, email: value, password, confirmPassword });
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    const nextValues = { name, email, password: value, confirmPassword };
    updateFieldError('password', nextValues);
    updateFieldError('confirmPassword', nextValues);
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    updateFieldError('confirmPassword', { name, email, password, confirmPassword: value });
  };

  const handleFieldBlur = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
    const nextErrors = getRegisterValidationErrors({ name, email, password, confirmPassword });
    setErrors((current) => ({
      ...current,
      [field]: nextErrors[field],
    }));
  };

  const handleRegister = async () => {
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizePassword(password);
    const validationErrors = getRegisterValidationErrors({
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      confirmPassword,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setLoading(true);
    try {
      await register(normalizedName, normalizedEmail, normalizedPassword);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Creating your account..." />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.crossWrap} pointerEvents="none">
          <View style={styles.crossV} /><View style={styles.crossH} />
        </View>
        <Text style={styles.est}>VICTORIA HOSPITAL</Text>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={styles.accentBar} />
        <Text style={styles.headerSub}>Join our patient portal for seamless care</Text>
      </View>

      {/* Form */}
      <Animated.View style={[styles.formPanel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>

          <CustomInput
            label="Full Name"
            value={name}
            onChangeText={handleNameChange}
            onBlur={() => handleFieldBlur('name')}
            placeholder="Dr. / Mr. / Ms. Full Name"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            errorMessage={errors.name}
          />
          <CustomInput
            label="Email Address"
            value={email}
            onChangeText={handleEmailChange}
            onBlur={() => handleFieldBlur('email')}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            errorMessage={errors.email}
          />
          <CustomInput
            label="Password"
            value={password}
            onChangeText={handlePasswordChange}
            onBlur={() => handleFieldBlur('password')}
            placeholder="Create a password with at least 6 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            errorMessage={errors.password}
          />
          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            onBlur={() => handleFieldBlur('confirmPassword')}
            placeholder="Re-enter your password"
            secureTextEntry
            autoComplete="new-password"
            textContentType="password"
            errorMessage={errors.confirmPassword}
          />

          <CustomButton title="Create Account" onPress={handleRegister} style={styles.btn} />

          <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.securityRow}>
            <View style={styles.shieldSmall} />
            <Text style={styles.securityText}>256-bit SSL · HIPAA Compliant</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.navyMid },
  header: {
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 36,
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -50, right: -60,
  },
  circle2: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30,
  },
  crossWrap: {
    position: 'absolute', right: 24, bottom: 16, width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center', opacity: 0.1,
  },
  crossV: { position: 'absolute', width: 14, height: 50, backgroundColor: COLORS.white, borderRadius: 3 },
  crossH: { position: 'absolute', width: 50, height: 14, backgroundColor: COLORS.white, borderRadius: 3 },
  est: { fontSize: 9, letterSpacing: 2.4, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  headerTitle: { fontSize: 30, fontWeight: FONTS.bold, color: COLORS.white, lineHeight: 36 },
  accentBar: { width: 40, height: 3, backgroundColor: COLORS.tealLight, borderRadius: 2, marginVertical: 12 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 19 },

  formPanel: {
    flex: 1,
    backgroundColor: COLORS.bgPage,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 30,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright,
    letterSpacing: 2, marginBottom: 16,
  },
  btn: { marginTop: 8, marginBottom: 4 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 24 },
  loginText: { fontSize: 13, color: COLORS.textMuted },
  loginLink: { fontSize: 13, fontWeight: FONTS.bold, color: COLORS.link },

  securityRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  shieldSmall: { width: 11, height: 12, borderWidth: 1.5, borderColor: COLORS.security, borderRadius: 2, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  securityText: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 0.3 },
});

export default RegisterScreen;
