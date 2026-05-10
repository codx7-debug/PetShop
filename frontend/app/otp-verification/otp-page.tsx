import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../../contexts/LanguageContext';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function OtpVerificationScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { phone, sessionId } = useLocalSearchParams<{ phone?: string; sessionId?: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const phoneDisplay = phone && phone.length >= 4
    ? phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4)
    : phone || '';

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (idx === 5 && val) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async (_code?: string) => {
    setError('');
    setLoading(true);
    const code = (_code ?? otp.join('')).trim();
    if (code.length !== 6) {
      setError(t('otp.enterCode'));
      setLoading(false);
      return;
    }
    try {
      // retrieve partial registration data, since login is not yet completed
      const draftStr = await AsyncStorage.getItem('@petshop_user_register_otp_draft');
      const draft = draftStr ? JSON.parse(draftStr) : {};
      const res = await fetch(`${API_BASE_URL}/api/auth/register-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || draft.sessionId,
          code,
          ...draft,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; token?: string; user?: unknown };
      if (!res.ok) {
        setError(data.message || t('otp.verificationFailed'));
        setLoading(false);
        return;
      }

      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }
      if (data.user) {
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }
      // Clean up
      await AsyncStorage.removeItem('@petshop_user_register_otp_draft');
      router.replace('/home');
    } catch (e: any) {
      setError(e?.message || t('otp.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      // Retrieve phone from stored draft if not present
      let p = phone;
      if (!p) {
        const draftStr = await AsyncStorage.getItem('@petshop_user_register_otp_draft');
        const draft = draftStr ? JSON.parse(draftStr) : {};
        p = draft.phone;
      }
      if (!p) {
        setError(t('otp.phoneNotFound'));
        setResending(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/auth/register-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; sessionId?: string };
      if (!res.ok) {
        setError(data.message || t('otp.unableResend'));
        setResending(false);
        return;
      }
      // Update AsyncStorage with new sessionId
      const draftStr = await AsyncStorage.getItem('@petshop_user_register_otp_draft');
      let draft = draftStr ? JSON.parse(draftStr) : {};
      draft.sessionId = data.sessionId || '';
      await AsyncStorage.setItem('@petshop_user_register_otp_draft', JSON.stringify(draft));
      // Optionally update route param for sessionId (force remount)
      router.setParams({ sessionId: data.sessionId || '' });
    } catch (e: any) {
      setError(e?.message || t('otp.resendFailed'));
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.outer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <View style={styles.container}>
          <Ionicons name="chatbubble-ellipses-outline" size={56} color="#2B9B7A" style={{ marginBottom: 8 }} />
          <Text style={styles.title}>{t('otp.title')}</Text>
          <Text style={styles.subtitle}>
            {t('otp.subtitle')}{phoneDisplay ? <Text style={{ fontWeight: 'bold' }}> {phoneDisplay}</Text> : ''}.
          </Text>
          <View style={styles.otpRow}>
            {[...Array(6)].map((_, i) => (
              <TextInput
                key={i}
                ref={ref => { inputRefs.current[i] = ref; }}
                style={[styles.otpInput, otp[i] && styles.otpInputActive]}
                value={otp[i]}
                onChangeText={val => handleOtpChange(val, i)}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={i === 0}
                onKeyPress={(e) => handleKeyPress(e, i)}
                returnKeyType={i === 5 ? 'done' : 'next'}
                textContentType="oneTimeCode"
              />
            ))}
          </View>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="close-circle-outline" color="#D64545" size={16} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.btnDisabled]}
            onPress={() => handleVerify()}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.verifyBtnText}>{t('otp.verifyContinue')}</Text>
                <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
          <View style={styles.resendRow}>
            <Text style={{ color: '#666', fontSize: 15 }}>
              {t('otp.didntGetCode')}{' '}
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
              {resending ? (
                <ActivityIndicator color="#2B9B7A" size="small" />
              ) : (
                <Text style={styles.resendText}>{t('otp.resend')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#F0F5F9',
  },
  container: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#2B9B7A',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0A2540',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#5c6b7a',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 280,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  otpInput: {
    width: 44,
    height: 54,
    backgroundColor: '#F7FBF9',
    borderWidth: 2,
    borderColor: '#E4EFEA',
    borderRadius: 14,
    fontSize: 24,
    color: '#1A3A2D',
    fontWeight: '900',
    textAlign: 'center',
  },
  otpInputActive: {
    borderColor: '#2B9B7A',
    backgroundColor: '#E6FFEC',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFD0D0',
    alignSelf: 'stretch',
  },
  errorText: {
    color: '#D64545',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  verifyBtn: {
    backgroundColor: '#2B9B7A',
    borderRadius: 16,
    height: 50,
    minWidth: 190,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
    gap: 6,
    shadowColor: '#2B9B7A',
    shadowOpacity: 0.20,
    shadowRadius: 7,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    gap: 4,
  },
  resendText: {
    color: '#2B9B7A',
    fontWeight: '800',
    fontSize: 15,
    textDecorationLine: 'underline',
    marginLeft: 2,
  },
});