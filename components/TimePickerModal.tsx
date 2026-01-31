import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (hour: number, minute: number) => void;
  hour: number;
  minute: number;
  theme: any;
}

export default function TimePickerModal({
  visible,
  onClose,
  onSave,
  hour,
  minute,
  theme
}: TimePickerModalProps) {
  const [localHour, setLocalHour] = useState('');
  const [localMinute, setLocalMinute] = useState('');
  const [isPM, setIsPM] = useState(false);

  const minuteInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setLocalHour((hour % 12 || 12).toString());
      setLocalMinute(minute.toString().padStart(2, '0'));
      setIsPM(hour >= 12);
    }
  }, [visible, hour, minute]);

  const validate = () => {
    let h = parseInt(localHour) || 12;
    let m = parseInt(localMinute) || 0;
    h = Math.max(1, Math.min(12, h));
    m = Math.max(0, Math.min(59, m));
    const finalHour = isPM ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    return { h, m, finalHour };
  };

  const handleSave = () => {
    const { finalHour, m } = validate();
    onSave(finalHour, m);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.timePickerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>Set Reminder</Text>

          <View style={styles.timerContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.timeInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                value={localHour}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '');
                  setLocalHour(cleaned);
                  if (cleaned.length === 2) minuteInputRef.current?.focus();
                }}
                keyboardType="number-pad"
                maxLength={2}
                onBlur={() => {
                  const h = parseInt(localHour);
                  if (isNaN(h) || h < 1) setLocalHour('12');
                  else if (h > 12) setLocalHour('12');
                }}
                selectTextOnFocus
              />
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>HOUR</Text>
            </View>

            <Text style={[styles.timeSeparator, { color: theme.text }]}>:</Text>

            <View style={styles.inputWrapper}>
              <TextInput
                ref={minuteInputRef}
                style={[styles.timeInput, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
                value={localMinute}
                onChangeText={(val) => setLocalMinute(val.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={2}
                onBlur={() => {
                  const m = parseInt(localMinute);
                  if (isNaN(m) || m < 0) setLocalMinute('00');
                  else if (m > 59) setLocalMinute('59');
                  else setLocalMinute(m.toString().padStart(2, '0'));
                }}
                selectTextOnFocus
              />
              <Text style={[styles.inputLabel, { color: theme.secondaryText }]}>MIN</Text>
            </View>

            <View>
              <TouchableOpacity
                onPress={() => setIsPM(!isPM)}
                style={[styles.ampmBadge, { backgroundColor: theme.border }]}
              >
                <Text style={[styles.ampmText, { color: theme.text }]}>{isPM ? 'PM' : 'AM'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.modalActions, { borderTopColor: theme.border }]}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={[styles.modalButtonText, { color: theme.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { borderLeftWidth: 1, borderLeftColor: theme.border }]}
              onPress={handleSave}
            >
              <Text style={[styles.modalButtonText, { color: theme.text, fontWeight: '700' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  timePickerCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  timeSeparator: {
    fontSize: 40,
    fontWeight: '300',
    width: 20,
    textAlign: 'center',
  },
  ampmBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginLeft: 4,
  },
  ampmText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 18,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputWrapper: {
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1.5,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  }
});
