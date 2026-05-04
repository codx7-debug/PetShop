import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';

export default function OrgPendingScreen() {
  const { t, isRTL } = useLanguage();
  const ta = {
    writingDirection: (isRTL ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity
        style={[styles.backRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => router.replace('/login')}
        hitSlop={12}
      >
        <Text style={styles.backChev}>{isRTL ? '›' : '‹'}</Text>
        <Text style={styles.backLabel}>{t('common.back')}</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={[styles.title, ta]}>{t('orgPending.title')}</Text>
        <Text style={[styles.description, ta]}>{t('orgPending.body')}</Text>
        <Text style={[styles.subDescription, ta]}>{t('orgPending.sub')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backRow: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 6,
  },
  backChev: {
    fontSize: 22,
    color: '#036672',
    fontWeight: '700',
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#028383',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#5663ff',
  },
  description: {
    fontSize: 17,
    fontWeight: '500',
    color: '#222',
    textAlign: 'center',
    marginBottom: 10,
  },
  subDescription: {
    fontSize: 15,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
});
