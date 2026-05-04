import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, KeyboardAvoidingView, Platform, Dimensions, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import type { AppLocale } from '../i18n/translations';
import { SUPPORTED_LOCALES, LOCALE_NAMES } from '../i18n/translations';

const { width } = Dimensions.get('window');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const ORG_DRAFT_KEY = '@petshop_org_registration_draft';

export default function AuthScreen() {
  const { t, isRTL, locale, setLocale } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'guest' | 'user' | 'org'>('guest');

  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgNumber, setOrgNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateOrgLogin = (): string | null => {
    if (!email.trim()) return t('login.errEmailRequired');
    const lower = email.trim().toLowerCase();
    if (lower !== 'admin' && !/\S+@\S+\.\S+/.test(email)) return t('login.errEmailInvalid');
    if (!password) return t('login.errPasswordRequired');
    return null;
  };

  const validateOrgRegister = (): string | null => {
    if (!orgName.trim()) return t('login.errOrgName');
    if (!phone.trim()) return t('login.errPhoneRequired');
    if (!email.trim()) return t('login.errEmailRequired');
    if (!/\S+@\S+\.\S+/.test(email)) return t('login.errEmailInvalid');
    if (!password) return t('login.errPasswordRequired');
    if (password.length < 6) return t('login.errPasswordMin');
    if (!orgNumber.trim()) return t('login.errOrgNumberRequired');
    return null;
  };

  const validateUserRegister = (): string | null => {
    if (!fullName.trim()) return t('login.errFullName');
    if (!email.trim()) return t('login.errEmailRequired');
    if (!/\S+@\S+\.\S+/.test(email)) return t('login.errEmailInvalid');
    if (!password) return t('login.errPasswordRequired');
    if (password.length < 6) return t('login.errPasswordMin');
    return null;
  };

  const handleMainAction = async () => {
    setError('');
    if (userType === 'guest') {
      router.replace('/home');
      return;
    }

    if (userType === 'org' && isLogin) {
      const err = validateOrgLogin();
      if (err) {
        setError(err);
        return;
      }
      setLoading(true);
      try {
        await handleLogin();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('login.errGeneric'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (userType === 'org' && !isLogin) {
      const err = validateOrgRegister();
      if (err) {
        setError(err);
        return;
      }
      setLoading(true);
      try {
        await AsyncStorage.setItem(
          ORG_DRAFT_KEY,
          JSON.stringify({
            orgName: orgName.trim(),
            phone: phone.trim(),
            email: email.trim().toLowerCase(),
            password,
            orgNumber: orgNumber.trim(),
          })
        );
        router.push('/org-services');
      } catch {
        setError(t('login.errGeneric'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (userType === 'user' && isLogin) {
      const err = validateOrgLogin();
      if (err) {
        setError(err);
        return;
      }
      setLoading(true);
      try {
        await handleLogin();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('login.errGeneric'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (userType === 'user' && !isLogin) {
      const err = validateUserRegister();
      if (err) {
        setError(err);
        return;
      }
      setLoading(true);
      try {
        await handleRegisterUser();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('login.errGeneric'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegisterUser = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        role: 'user',
        full_name: fullName.trim(),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) {
      throw new Error(data.message || t('login.errRegisterFailed'));
    }
    await handleLogin();
  };

  const handleLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      code?: string;
      token?: string;
      user?: unknown;
      service_provider?: boolean;
    };

    if (response.status === 403 && data.code === 'ORG_PENDING') {
      router.replace('/org-pending');
      return;
    }

    if (!response.ok) {
      throw new Error(data.message || t('login.errLoginFailed'));
    }

    if (data.token) {
      await AsyncStorage.setItem('token', data.token);
    }
    if (data.user) {
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
    }

    const u = data.user as { role?: string } | undefined;
    const role = String(u?.role ?? "")
      .trim()
      .toLowerCase();
    const isOrgAccount = role === "org" || data.service_provider === true;

    if (role === "admin") {
      router.replace({ pathname: "/admin-dashboard" });
      return;
    }
    if (isOrgAccount) {
      router.replace({ pathname: "/org-dashboard" });
      return;
    }

    router.replace('/home');
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError('');
    setFullName('');
    setOrgName('');
    setPhone('');
    setOrgNumber('');
    setPassword('');
    setEmail('');
  };

  const cardTitle =
    userType === 'guest'
      ? isLogin
        ? t('login.cardGuestLogin')
        : t('login.cardGuestRegister')
      : userType === 'user'
        ? isLogin
          ? t('login.cardLoginUser')
          : t('login.cardRegisterUser')
        : isLogin
          ? t('login.cardLoginOrg')
          : t('login.cardRegisterOrg');

  const mainBtnLabel =
    userType === 'guest'
      ? t('login.btnContinueAsGuest')
      : userType === 'user'
        ? isLogin
          ? t('login.btnLoginUser')
          : t('login.btnRegisterUser')
        : isLogin
          ? t('login.btnLoginOrg')
          : t('login.btnOrgContinue');

  return (
    <View style={styles.container}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoFrame}>
              <Image
                source={require('../components/logo2.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Petora</Text>
            <Text style={styles.tagline}>{t('login.tagline')}</Text>
          </View>

          <View style={[styles.languageBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.languageTitle, isRTL ? { textAlign: 'right' as const } : {}]}>
              {t('login.languageChooser')}
            </Text>
            <Text style={[styles.languageSub, isRTL ? { textAlign: 'right' as const } : {}]}>
              {t('login.languageChooserSub')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.langScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              {(SUPPORTED_LOCALES as readonly AppLocale[]).map((code) => {
                const active = locale === code;
                return (
                  <TouchableOpacity
                    key={code}
                    style={[styles.langChip, active && styles.langChipActive]}
                    onPress={() => void setLocale(code)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.langChipText, active && styles.langChipTextActive]}>
                      {LOCALE_NAMES[code]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.accountPicker}>
            <View style={[styles.topPair, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[styles.compactTypeBtn, userType === 'guest' && styles.newTypeBtnActive]}
                onPress={() => { setUserType('guest'); setError(''); }}
                activeOpacity={0.85}
              >
                <Ionicons name="happy-outline" size={32} color={userType === 'guest' ? '#fff' : '#2B9B7A'} style={{ marginBottom: 8 }} />
                <Text style={[styles.compactTypeText, userType === 'guest' && styles.newTypeBtnTextActive]}>
                  {t('login.guest')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactTypeBtn, userType === 'user' && styles.newTypeBtnActive]}
                onPress={() => { setUserType('user'); setError(''); }}
                activeOpacity={0.85}
              >
                <Ionicons name="person-circle-outline" size={32} color={userType === 'user' ? '#fff' : '#2B9B7A'} style={{ marginBottom: 8 }} />
                <Text style={[styles.compactTypeText, userType === 'user' && styles.newTypeBtnTextActive]}>
                  {t('login.accountUser')}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.orgWideBtn, userType === 'org' && styles.newTypeBtnActive]}
              onPress={() => { setUserType('org'); setError(''); }}
              activeOpacity={0.85}
            >
              <Ionicons name="business" size={32} color={userType === 'org' ? '#fff' : '#2B9B7A'} style={{ marginBottom: 8 }} />
              <Text style={[styles.orgWideTitle, userType === 'org' && styles.newTypeBtnTextActive]}>
                {t('login.org')}
              </Text>
              <Text style={[styles.orgWideSub, userType === 'org' && styles.orgWideSubActive]}>
                {t('login.orgSubtitle')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.cardTitle}>{cardTitle}</Text>

            {(userType === 'org' || userType === 'user') && (
              <View style={styles.inputWrapper}>
                {userType === 'user' && !isLogin && (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
                    <TextInput
                      placeholder={t('login.phFullName')}
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholderTextColor="#9EB2C9"
                    />
                  </View>
                )}
                {userType === 'org' && isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phEmail')}
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholderTextColor="#9EB2C9"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phPassword')}
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#9EB2C9"
                      />
                    </View>
                  </>
                )}
                {userType === 'org' && !isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="business-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phOrgName')}
                        style={styles.input}
                        value={orgName}
                        onChangeText={setOrgName}
                        placeholderTextColor="#9EB2C9"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phPhone')}
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholderTextColor="#9EB2C9"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phEmail')}
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholderTextColor="#9EB2C9"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phPassword')}
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#9EB2C9"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="id-card-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phOrgNumber')}
                        style={styles.input}
                        value={orgNumber}
                        onChangeText={setOrgNumber}
                        placeholderTextColor="#9EB2C9"
                        autoCapitalize="characters"
                      />
                    </View>
                  </>
                )}
                {userType === 'user' && isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phEmail')}
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholderTextColor="#9EB2C9"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phPassword')}
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#9EB2C9"
                      />
                    </View>
                  </>
                )}
                {userType === 'user' && !isLogin && (
                  <>
                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phEmail')}
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        placeholderTextColor="#9EB2C9"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
                      <TextInput
                        placeholder={t('login.phPassword')}
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholderTextColor="#9EB2C9"
                      />
                    </View>
                  </>
                )}
              </View>
            )}

            {userType === 'guest' && !isLogin && (
              <Text style={styles.guestHint}>{t('login.guestRegisterHint')}</Text>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color="#D64545" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {(userType === 'org' || userType === 'user') && isLogin ? (
              <Text style={styles.adminHint}>{t('login.adminSignInHint')}</Text>
            ) : null}

            {(userType === 'org' || userType === 'user') && isLogin && (
              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>{t('login.forgot')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.mainBtn, loading && styles.mainBtnDisabled]}
              activeOpacity={0.8}
              onPress={() => void handleMainAction()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.mainBtnText}>{mainBtnLabel}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            {(userType === 'guest' || userType === 'user') && (
              <>
                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.dividerText}>{t('common.or')}</Text>
                  <View style={styles.line} />
                </View>
                <View style={styles.socialRow}>
                  <TouchableOpacity style={styles.socialBtn}>
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialBtn}>
                    <Ionicons name="logo-apple" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!isLogin && userType === 'org' && (
              <View style={styles.orgHint}>
                <Ionicons name="information-circle-outline" size={16} color="#888" />
                <Text style={styles.orgHintText}>{t('login.orgHint')}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.toggleBtn} onPress={handleToggle}>
            <Text style={styles.toggleText}>
              {userType === 'guest'
                ? isLogin
                  ? t('login.toggleNoUser')
                  : t('login.toggleHasUser')
                : userType === 'user'
                  ? isLogin
                    ? t('login.toggleNoUser')
                    : t('login.toggleHasUser')
                  : isLogin
                    ? t('login.toggleNoOrg')
                    : t('login.toggleHasOrg')}
              <Text style={styles.toggleTextBold}>{isLogin ? t('login.toggleRegister') : t('login.toggleLogin')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F5F9' },
  circle1: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: '#E3FFF3' },
  circle2: { position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFE7E4' },

  scrollContent: { paddingHorizontal: 25, paddingBottom: 40, paddingTop: 60 },

  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoFrame: {
    width: 90, height: 90, backgroundColor: '#FFF', borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    borderTopLeftRadius: 40, borderBottomRightRadius: 40,
  },
  logo: { width: 90, height: 90 },
  brandName: { fontSize: 32, fontWeight: '900', color: '#0A2540', marginTop: 15 },
  tagline: { fontSize: 14, color: '#666', fontWeight: '500' },

  languageBlock: {
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  languageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A2540',
    marginBottom: 4,
  },
  languageSub: {
    fontSize: 12,
    color: '#5c6b7a',
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 10,
    maxWidth: '100%',
  },
  langScroll: {
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#cfe8de',
    backgroundColor: '#fff',
  },
  langChipActive: {
    borderColor: '#2B9B7A',
    backgroundColor: '#2B9B7A',
  },
  langChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#247059',
  },
  langChipTextActive: {
    color: '#fff',
  },

  accountPicker: {
    width: '100%',
    marginBottom: 22,
    gap: 12,
  },
  topPair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 12,
  },
  compactTypeBtn: {
    flex: 1,
    minHeight: 100,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#212121',
    shadowRadius: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  compactTypeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2B9B7A',
    textAlign: 'center',
  },
  orgWideBtn: {
    width: '100%',
    minHeight: 104,
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#212121',
    shadowRadius: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  orgWideTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2B9B7A',
    textAlign: 'center',
  },
  orgWideSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5c7d76',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  orgWideSubActive: {
    color: '#C1FFE5',
  },
  newTypeBtn: {
    width: width * 0.4, minHeight: 95, backgroundColor: '#fff',
    borderRadius: 24, borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#212121', shadowRadius: 8, shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
    justifyContent: 'center', alignItems: 'center',
    paddingVertical: 15, paddingHorizontal: 10,
  },
  newTypeBtnActive: {
    backgroundColor: '#2B9B7A', borderColor: '#2B9B7A',
    shadowColor: '#2B9B7A', shadowOpacity: 0.16, elevation: 8,
  },
  newTypeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#2B9B7A', textAlign: 'center', letterSpacing: 0.1 },
  newTypeBtnTextActive: { color: '#FFF' },
  optionSecondaryText: { fontSize: 13, color: '#C1FFE5', fontWeight: '600' },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 35, padding: 25,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#0A2540', marginBottom: 25, textAlign: 'center' },

  inputWrapper: { gap: 15 },
  guestHint: {
    fontSize: 15, color: '#5c6b7a', textAlign: 'center', marginBottom: 16, lineHeight: 22, paddingHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 18,
    paddingHorizontal: 15, height: 55,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF0F0', borderRadius: 12,
    padding: 12, marginTop: 14,
    borderWidth: 1, borderColor: '#FFD0D0',
  },
  errorText: { color: '#D64545', fontSize: 13, fontWeight: '600', flex: 1 },

  adminHint: {
    fontSize: 12,
    color: '#5a6b7c',
    marginTop: 10,
    lineHeight: 17,
    paddingHorizontal: 4,
  },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 12 },
  forgotText: { color: '#FE6E40', fontWeight: '700', fontSize: 13 },

  mainBtn: {
    backgroundColor: '#2B9B7A', height: 55, borderRadius: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 25, gap: 10,
    shadowColor: '#2B9B7A', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  mainBtnDisabled: { opacity: 0.65 },
  mainBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { marginHorizontal: 10, color: '#AAA', fontWeight: '600' },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialBtn: {
    width: 60, height: 60, backgroundColor: '#FFF', borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#F0F0F0',
  },

  orgHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    marginTop: 20, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12,
  },
  orgHintText: { color: '#888', fontSize: 13, flex: 1 },

  toggleBtn: { marginTop: 30, alignItems: 'center' },
  toggleText: { fontSize: 14, color: '#666' },
  toggleTextBold: { color: '#FE6E40', fontWeight: '800' },
});
