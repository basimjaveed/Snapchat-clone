import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { COLORS, FONTS, SPACING } from '../../constants/theme';

export default function SignupScreen() {
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
  });
  
  const { signup, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();

  const handleSignup = async () => {
    const { username, displayName, email, password } = form;
    if (!username || !displayName || !email || !password) return;
    
    try {
      await signup(form);
    } catch (err) {
      // Error handled by store
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (error) clearError();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the distraction-free world</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Username"
            placeholder="johndoe"
            value={form.username}
            onChangeText={(text) => updateForm('username', text)}
            leftIcon="at-outline"
          />
          <Input
            label="Display Name"
            placeholder="John Doe"
            value={form.displayName}
            onChangeText={(text) => updateForm('displayName', text)}
            leftIcon="person-outline"
          />
          <Input
            label="Email Address"
            placeholder="example@email.com"
            value={form.email}
            onChangeText={(text) => updateForm('email', text)}
            keyboardType="email-address"
            leftIcon="mail-outline"
          />
          <Input
            label="Password"
            placeholder="Min. 6 characters"
            value={form.password}
            onChangeText={(text) => updateForm('password', text)}
            isPassword
            leftIcon="lock-closed-outline"
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="Sign Up"
            onPress={handleSignup}
            loading={isLoading}
            style={styles.button}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
  },
  linkText: {
    color: COLORS.primary,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
  },
});
