import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, FONTS } from '../theme';

const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  numberOfLines,
  style,
  editable = true,
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  errorMessage,
  passwordStrength,
  onBlur: onBlurProp,
}) => {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
    onBlurProp?.();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.inputBorder, COLORS.inputFocus],
  });

  const resolvedSecureTextEntry = secureTextEntry ? !passwordVisible : false;
  const strengthTone = {
    weak: COLORS.danger,
    medium: COLORS.warning,
    strong: COLORS.success,
  }[passwordStrength?.level];

  return (
    <View style={[styles.group, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.inputWrap, errorMessage ? styles.inputWrapError : { borderColor }]}>
        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          secureTextEntry={resolvedSecureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setPasswordVisible((current) => !current)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
      {passwordStrength?.score ? (
        <View style={styles.strengthWrap}>
          <View style={styles.strengthBars}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.strengthBar,
                  step <= passwordStrength.score && { backgroundColor: strengthTone },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthText, { color: strengthTone }]}>
            {passwordStrength.label}
          </Text>
        </View>
      ) : null}
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: FONTS.semibold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputWrap: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapError: {
    borderColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: FONTS.regular,
  },
  inputMulti: {
    textAlignVertical: 'top',
    minHeight: 90,
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.danger,
  },
  strengthWrap: {
    marginTop: 8,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgMuted,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: FONTS.bold,
    minWidth: 52,
    textAlign: 'right',
  },
  toggleButton: {
    paddingRight: 14,
    paddingLeft: 8,
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: FONTS.bold,
    color: COLORS.link,
    letterSpacing: 0.3,
  },
});

export default CustomInput;
