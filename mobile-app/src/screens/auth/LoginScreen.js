import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  navyDeep: '#0a2e40',
  navyMid: '#0a4a6e',
  tealStrong: '#0d6b99',
  tealBright: '#1a8cb5',
  tealLight: '#4fc3e8',
  tealPale: '#d8e8f0',
  tealFaint: '#f0f7fb',
  white: '#ffffff',
  textPrimary: '#0a2e40',
  textSecondary: '#4a6170',
  textMuted: '#7a99a8',
  textPlaceholder: '#b0c8d4',
  inputBg: '#f7fbfd',
  inputBorder: '#d8e8f0',
  inputBorderFocus: '#1a8cb5',
  divider: '#eef4f8',
  labelColor: '#4a6170',
  link: '#0d6b99',
  security: '#a0b8c4',
};

// ─── Reusable Icon Components (SVG-like with Views) ──────────────────────────
const MailIcon = ({ color = COLORS.security }) => (
  <View style={iconStyles.wrapper}>
    <View style={[iconStyles.mailBody, { borderColor: color }]}>
      <View style={[iconStyles.mailChevron, { borderColor: color }]} />
    </View>
  </View>
);

const LockIcon = ({ color = COLORS.security }) => (
  <View style={iconStyles.wrapper}>
    <View style={[iconStyles.lockBody, { borderColor: color }]}>
      <View style={[iconStyles.lockShackle, { borderColor: color }]} />
      <View style={[iconStyles.lockDot, { backgroundColor: color }]} />
    </View>
  </View>
);

const ShieldIcon = ({ color = COLORS.security }) => (
  <View style={[iconStyles.shield, { borderColor: color }]}>
    <View style={[iconStyles.shieldInner, { borderColor: color }]} />
  </View>
);

const MedicalCross = () => (
  <View style={crossStyles.container} pointerEvents="none">
    <View style={crossStyles.vertical} />
    <View style={crossStyles.horizontal} />
  </View>
);

// ─── Custom Input Field ───────────────────────────────────────────────────────
const HospitalInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  icon,
  textContentType,
  autoComplete,
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.inputBorder, COLORS.inputBorderFocus],
  });

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.inputBg, COLORS.white],
  });

  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View
        style={[
          inputStyles.wrapper,
          { borderColor, backgroundColor: bgColor },
        ]}
      >
        <View style={inputStyles.iconSlot}>{icon}</View>
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={textContentType}
          autoComplete={autoComplete}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Animated.View>
    </View>
  );
};

// ─── Main Login Screen ────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  // Entrance animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(btnAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    // Button press animation
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    setLoading(true);
    try {
      await login(normalizedEmail, normalizedPassword);
    } catch (error) {
      const message = error.response?.data?.message
        || (error.request ? 'Cannot reach the server. Check backend, Wi-Fi IP, and MongoDB connection.' : error.message)
        || 'Invalid credentials. Please try again.';

      Alert.alert(
        'Sign In Failed',
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header Panel ── */}
        <View style={styles.headerPanel}>
          <MedicalCross />

          {/* Decorative circles */}
          <View style={styles.circleTopRight} />
          <View style={styles.circleBottomLeft} />

          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: headerAnim,
                transform: [
                  {
                    translateY: headerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.hospitalEst}>EST. 2005 · Tissamaharama, SRI LANKA</Text>
            <Text style={styles.hospitalName}>VICTORIA{'\n'}Hospital</Text>
            <View style={styles.accentBar} />
            <Text style={styles.tagline}>
              Compassionate care, advanced medicine.{'\n'}Your health is our highest calling.
            </Text>
          </Animated.View>
        </View>

        {/* ── Form Panel ── */}
        <View style={styles.formPanel}>
          {/* Portal label */}
          <Animated.View
            style={{
              opacity: formAnim,
              transform: [
                {
                  translateY: formAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            <Text style={styles.portalLabel}>PATIENT & STAFF PORTAL</Text>
            <Text style={styles.formTitle}>Sign in to{'\n'}your account</Text>

            {/* Email */}
            <HospitalInput
              label="EMAIL ADDRESS"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              icon={
                <View style={miniIconStyles.mail}>
                  <View style={miniIconStyles.mailRect} />
                  <View style={miniIconStyles.mailLine} />
                </View>
              }
            />

            {/* Password */}
            <HospitalInput
              label="PASSWORD"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              icon={
                <View style={miniIconStyles.lock}>
                  <View style={miniIconStyles.lockArc} />
                  <View style={miniIconStyles.lockBody} />
                </View>
              }
            />

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Sign In Button */}
          <Animated.View
            style={{
              opacity: btnAnim,
              transform: [
                {
                  translateY: btnAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                { scale: btnScale },
              ],
            }}
          >
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnLoading]}
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                <Text style={styles.registerLink}>Register here</Text>
              </TouchableOpacity>
            </View>

            {/* Security badge */}
            <View style={styles.securityBadge}>
              <View style={styles.shieldWrap}>
                <View style={styles.shieldOuter} />
              </View>
              <Text style={styles.securityText}>
                Nadeesha D Shalom - SLIIT WMT 2026
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.navyDeep,
  },
  scroll: {
    flexGrow: 1,
  },

  // Header
  headerPanel: {
    backgroundColor: COLORS.navyMid,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  headerContent: {
    position: 'relative',
    zIndex: 2,
  },
  circleTopRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60,
    right: -70,
    zIndex: 0,
  },
  circleBottomLeft: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -40,
    zIndex: 0,
  },
  hospitalEst: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2.4,
    marginBottom: 10,
  },
  hospitalName: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.white,
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  accentBar: {
    width: 44,
    height: 3,
    backgroundColor: COLORS.tealLight,
    borderRadius: 2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
    fontWeight: '300',
  },

  // Form panel
  formPanel: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  portalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.tealBright,
    letterSpacing: 2.5,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navyDeep,
    lineHeight: 34,
    marginBottom: 28,
    letterSpacing: 0.2,
  },

  // Forgot
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 12,
    color: COLORS.link,
    fontWeight: '500',
  },

  // Login button
  loginBtn: {
    backgroundColor: COLORS.tealStrong,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 20,
    shadowColor: COLORS.tealStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnLoading: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.6,
  },

  // Register
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  registerText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  registerLink: {
    fontSize: 13,
    color: COLORS.link,
    fontWeight: '600',
  },

  // Security
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: 8,
  },
  shieldWrap: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldOuter: {
    width: 12,
    height: 13,
    borderWidth: 1.5,
    borderColor: COLORS.security,
    borderRadius: 2,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  securityText: {
    fontSize: 10,
    color: COLORS.security,
    letterSpacing: 0.3,
  },
});

const inputStyles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.labelColor,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  iconSlot: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '400',
  },
});

const miniIconStyles = StyleSheet.create({
  mail: {
    width: 18,
    height: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mailRect: {
    width: 18,
    height: 12,
    borderWidth: 1.5,
    borderColor: COLORS.security,
    borderRadius: 2,
    position: 'absolute',
  },
  mailLine: {
    width: 13,
    height: 1.5,
    backgroundColor: COLORS.security,
    transform: [{ rotate: '-25deg' }],
    top: 4,
  },
  lock: {
    width: 16,
    height: 18,
    alignItems: 'center',
  },
  lockArc: {
    width: 10,
    height: 6,
    borderWidth: 1.5,
    borderColor: COLORS.security,
    borderBottomWidth: 0,
    borderRadius: 5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: -1,
  },
  lockBody: {
    width: 14,
    height: 10,
    borderWidth: 1.5,
    borderColor: COLORS.security,
    borderRadius: 2,
  },
});

const crossStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    bottom: 20,
    width: 80,
    height: 80,
    opacity: 0.1,
    zIndex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertical: {
    position: 'absolute',
    width: 22,
    height: 70,
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  horizontal: {
    position: 'absolute',
    width: 70,
    height: 22,
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
});

const iconStyles = StyleSheet.create({
  wrapper: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mailBody: {
    width: 16,
    height: 12,
    borderWidth: 1.5,
    borderRadius: 2,
  },
  mailChevron: {
    width: 10,
    height: 6,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '-45deg' }],
  },
  lockBody: {
    width: 13,
    height: 10,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  lockShackle: {
    position: 'absolute',
    top: -7,
    width: 8,
    height: 7,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderRadius: 4,
  },
  lockDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  shield: {
    width: 14,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 2,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldInner: {
    width: 7,
    height: 8,
    borderWidth: 1,
    borderRadius: 1,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
});

export default LoginScreen;
