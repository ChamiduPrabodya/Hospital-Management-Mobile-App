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
import {
  requestPasswordResetOtpApi,
  resetPasswordWithOtpApi,
} from '../../api/authApi';
import {
  getPasswordStrength,
  getForgotPasswordRequestErrors,
  getForgotPasswordResetErrors,
  normalizeEmail,
  normalizePassword,
} from '../../utils/validators';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState(false);
  const [submittedReset, setSubmittedReset] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const requestErrors = useMemo(() => getForgotPasswordRequestErrors({ email }), [email]);
  const resetErrors = useMemo(() => getForgotPasswordResetErrors({
    email,
    otp,
    password,
    confirmPassword,
  }), [confirmPassword, email, otp, password]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleRequestOtp = async () => {
    setSubmittedRequest(true);

    if (Object.keys(requestErrors).length > 0) {
      Alert.alert('Send OTP', requestErrors.email);
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    setLoadingMessage('Sending your OTP...');

    try {
      const response = await requestPasswordResetOtpApi(normalizedEmail);
      const nextOtp = response.data?.otp || '';
      setOtpSent(true);
      setDevOtp(nextOtp);

      const message = nextOtp
        ? `Use OTP ${nextOtp}. It expires in 10 minutes.`
        : response.data?.message || 'Your OTP has been sent.';

      Alert.alert('OTP Ready', message);
    } catch (error) {
      Alert.alert(
        'Send OTP Failed',
        error.response?.data?.message || 'Unable to generate an OTP right now. Please try again.'
      );
    } finally {
      setLoadingMessage('');
    }
  };

  const handleResetPassword = async () => {
    setSubmittedReset(true);

    if (Object.keys(resetErrors).length > 0) {
      const firstError = resetErrors.email || resetErrors.otp || resetErrors.password || resetErrors.confirmPassword;
      Alert.alert('Reset Password', firstError);
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizePassword(password);
    setLoadingMessage('Updating your password...');

    try {
      await resetPasswordWithOtpApi(normalizedEmail, otp.trim(), normalizedPassword);
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
        error.response?.data?.message || 'Unable to reset your password right now. Please try again.'
      );
    } finally {
      setLoadingMessage('');
    }
  };

  if (loadingMessage) return <LoadingSpinner message={loadingMessage} />;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyMid} />

      <View style={styles.header}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <Text style={styles.est}>VICTORIA HOSPITAL</Text>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <View style={styles.accentBar} />
        <Text style={styles.headerSub}>Request an OTP, verify it, and choose a new password.</Text>
      </View>

      <View style={styles.formPanel}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>ACCOUNT RECOVERY</Text>
          <Text style={styles.helpText}>
            Start by entering the email linked to your account. We will generate a 6-digit OTP that is valid for 10 minutes.
          </Text>

          <CustomInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            errorMessage={submittedRequest || submittedReset ? requestErrors.email || resetErrors.email : ''}
          />

          {!otpSent ? (
            <CustomButton title="Send OTP" onPress={handleRequestOtp} style={styles.submitBtn} />
          ) : (
            <>
              <View style={styles.successCard}>
                <Text style={styles.successTitle}>OTP Requested</Text>
                <Text style={styles.successText}>
                  Enter the 6-digit code and your new password below.
                </Text>
                {devOtp ? (
                  <TouchableOpacity onPress={() => setOtp(devOtp)} activeOpacity={0.7}>
                    <Text style={styles.devOtpText}>Dev OTP: {devOtp} (tap to use)</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <CustomInput
                label="OTP Code"
                value={otp}
                onChangeText={setOtp}
                placeholder="123456"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                errorMessage={submittedReset ? resetErrors.otp : ''}
              />

              <CustomInput
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Use 8+ chars with upper, lower, number, symbol"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                passwordStrength={passwordStrength}
                errorMessage={submittedReset ? resetErrors.password : ''}
              />

              <CustomInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter your new password"
                secureTextEntry
                autoComplete="new-password"
                textContentType="password"
                errorMessage={submittedReset ? resetErrors.confirmPassword : ''}
              />

              <CustomButton title="Reset Password" onPress={handleResetPassword} style={styles.submitBtn} />

              <TouchableOpacity onPress={handleRequestOtp} activeOpacity={0.7}>
                <Text style={styles.secondaryLink}>Resend OTP</Text>
              </TouchableOpacity>
            </>
          )}

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
  successCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
    ...SHADOW.card,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
    marginBottom: 4,
  },
  successText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  devOtpText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: FONTS.bold,
    color: COLORS.warning,
  },
  submitBtn: { marginTop: 8, marginBottom: 8 },
  secondaryLink: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.link,
    fontWeight: FONTS.semibold,
    marginTop: 6,
  },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, marginBottom: 24 },
  loginText: { fontSize: 13, color: COLORS.textMuted },
  loginLink: { fontSize: 13, fontWeight: FONTS.bold, color: COLORS.link },
});

export default ForgotPasswordScreen;
