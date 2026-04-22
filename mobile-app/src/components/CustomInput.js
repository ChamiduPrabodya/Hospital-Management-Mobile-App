import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
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
}) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.inputBorder, COLORS.inputFocus],
  });

  return (
    <View style={[styles.group, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Animated.View style={[styles.inputWrap, { borderColor }]}>
        <TextInput
          style={[styles.input, multiline && styles.inputMulti]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          autoCapitalize="none"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Animated.View>
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
  },
  input: {
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
});

export default CustomInput;
