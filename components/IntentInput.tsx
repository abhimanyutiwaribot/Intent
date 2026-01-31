import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useAppTheme } from '../app/_layout';
import { Colors } from '../constants/Colors';

interface IntentInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const IntentInput: React.FC<IntentInputProps> = ({ value, onChangeText, placeholder }) => {
  const { theme: activeTheme } = useAppTheme();
  const theme = Colors[activeTheme] || Colors.light;

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || "One meaningful task..."}
        placeholderTextColor={theme.secondaryText}
        multiline
        maxLength={120}
        selectionColor={theme.text}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 24,
  },
  input: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    padding: 10,
    minHeight: 100,
    letterSpacing: -0.5,
  },
});

export default IntentInput;
