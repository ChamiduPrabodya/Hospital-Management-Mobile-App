import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { forgotPasswordApi } from '../../api/authApi';
import {
  getForgotPasswordValidationErrors,
  normalizeEmail,
  normalizePassword,
} from '../../utils/validators';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => getForgotPasswordValidationErrors({
    email,
    password,
    confirmPassword,
  }), [confirmPassword, email, password]);
  const visibleErrors = submitted ? errors : {};

  const handleSubmit = async () => {
    setSubmitted(true);

    if (Object.keys(errors).length > 0) {
      const firstError = errors.email || errors.password || errors.confirmPassword;
      Alert.alert('Reset Password', firstError);
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizePassword(password);

    setLoading(true);
    try {
      await forgotPasswordApi(normalizedEmail, normalizedPassword);
      Alert.alert(
        'Password Updated',
        'Your password has been reset. Please sign in with the new password.',
        [{
          text: 'Go to Login',
          onPress: () => navigation.navigate('Login', { prefilledEmail: normalizedEmail }),
        }]
      );
    } catch (error) {
      Alert.alert(
        'Reset Failed',
        error.response?.data?.message || 'Unable to reset password right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Updating your password..." />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyMid} />

      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.est}>VICTORIA HOSPITAL</Text>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={styles.accentBar} />
        <Text style={styles.headerSub}>Reset your sign-in password to regain access to your portal.</Text>
      </View>

      <View style={styles.formPanel}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>ACCOUNT RECOVERY</Text>
          <Text style={styles.helpText}>
            Enter the email linked to your account and choose a new password with at least 6 characters.
          </Text>

          <CustomInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
          />
          {visibleErrors.email ? <Text style={styles.errorText}>{visibleErrors.email}</Text> : null}

          <CustomInput
            label="New Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter a new password"
            secureTextEntry
          />
          {visibleErrors.password ? <Text style={styles.errorText}>{visibleErrors.password}</Text> : null}

          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your new password"
            secureTextEntry
          />
          {visibleErrors.confirmPassword ? <Text style={styles.errorText}>{visibleErrors.confirmPassword}</Text> : null}

          <CustomButton title="Reset Password" onPress={handleSubmit} style={styles.submitBtn} />

          <TouchableOpacity style={styles.loginRow} onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.loginText}>Remembered it? </Text>
            <Text style={styles.loginLink}>Back to Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
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
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -50,
    right: -60,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -30,
  },
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
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.tealBright,
    letterSpacing: 2,
    marginBottom: 12,
  },
  helpText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 16,
    ...SHADOW.card,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.danger,
  },
  submitBtn: { marginTop: 8, marginBottom: 4 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: 24 },
  loginText: { fontSize: 13, color: COLORS.textMuted },
  loginLink: { fontSize: 13, fontWeight: FONTS.bold, color: COLORS.link },
});

export default ForgotPasswordScreen;
