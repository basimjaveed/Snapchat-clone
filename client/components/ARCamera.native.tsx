import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

export default function ARCamera() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        AR Camera features require react-native-vision-camera
      </Text>
      <Text style={styles.subtext}>
        Use Expo Go development build to enable AR features
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});
