import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SHADOW, FONTS } from '../theme';

const CustomButton = ({ title, onPress, disabled, variant = 'primary', style }) => {
  const isOutline = variant === 'outline';
  const isDanger  = variant === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        isOutline && styles.btnOutline,
        isDanger  && styles.btnDanger,
        disabled  && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.text,
          isOutline && styles.textOutline,
          isDanger  && styles.textDanger,
          disabled  && styles.textDisabled,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: COLORS.tealStrong,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginVertical: 6,
    ...SHADOW.btn,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.tealStrong,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnDanger: {
    backgroundColor: COLORS.danger,
    shadowColor: COLORS.danger,
  },
  btnDisabled: {
    backgroundColor: COLORS.tealPale,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: FONTS.semibold,
    letterSpacing: 0.4,
  },
  textOutline: {
    color: COLORS.tealStrong,
  },
  textDanger: {
    color: COLORS.white,
  },
  textDisabled: {
    color: COLORS.textMuted,
  },
});

export default CustomButton;