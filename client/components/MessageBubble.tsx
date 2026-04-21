import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Message } from '../stores/chatStore';
import { COLORS, FONTS, RADIUS, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showTime?: boolean;
  onPress?: () => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isMine, showTime = false, onPress }: MessageBubbleProps) {
  return (
    <View style={[styles.row, isMine ? styles.rowRight : styles.rowLeft]}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.8 : 1}
        onPress={onPress}
        style={[
          styles.bubble,
          isMine ? styles.bubbleSent : styles.bubbleReceived,
        ]}
      >
        {message.type === 'snap' ? (
          <View style={styles.snapInner}>
            <Ionicons 
              name="camera" 
              size={18} 
              color={isMine ? COLORS.bubbleSentText : COLORS.primary} 
              style={{ marginRight: 6 }} 
            />
            <Text style={[styles.text, isMine ? styles.textSent : styles.textReceived, { fontWeight: 'bold' }]}>
              {isMine ? 'Sent' : 'New Snap'}
            </Text>
          </View>
        ) : (
          <Text style={[styles.text, isMine ? styles.textSent : styles.textReceived]}>
            {message.text}
          </Text>
        )}
        <View style={styles.meta}>
          <Text style={[styles.time, isMine ? styles.timeSent : styles.timeReceived]}>
            {formatTime(message.createdAt)}
          </Text>
          {isMine && (
            <Ionicons
              name={message.read ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.read ? COLORS.primary : COLORS.bgElevated}
              style={styles.tick}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 2, paddingHorizontal: SPACING.md },
  rowRight: { alignItems: 'flex-end' },
  rowLeft: { alignItems: 'flex-start' },
  snapInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    minWidth: 80,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
  },
  bubbleSent: {
    backgroundColor: COLORS.bubbleSent,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: COLORS.bubbleReceived,
    borderBottomLeftRadius: 4,
  },
  text: { fontSize: FONTS.sizes.md, lineHeight: 20 },
  textSent: { color: COLORS.bubbleSentText },
  textReceived: { color: COLORS.bubbleReceivedText },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, justifyContent: 'flex-end' },
  time: { fontSize: 10 },
  timeSent: { color: 'rgba(0,0,0,0.45)' },
  timeReceived: { color: COLORS.textMuted },
  tick: { marginLeft: 3 },
});
