import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { useAppTheme } from '../app/_layout';
import { Colors } from '../constants/Colors';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, disabled, variant = 'primary', style }) => {
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;

  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: theme.text },
        isSecondary && { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
        isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.text },
        disabled && { opacity: 0.3 },
        style,
      ] as ViewStyle[]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <Text
        style={[
          styles.text,
          { color: theme.background },
          isSecondary && { color: theme.text },
          isOutline && { color: theme.text },
        ] as TextStyle[]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 60,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  text: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
});

export default PrimaryButton;
