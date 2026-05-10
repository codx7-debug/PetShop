import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import BottomNavBar from './bottomNavBar';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageShortcutsBar } from '../components/LanguageShortcutsBar';

export default function SettingsPage() {
  const { t, locale, setLocale, isRTL } = useLanguage();

  const [settings, setSettings] = React.useState({
    notifications: true,
    locationServices: true,
  });
  const [locationSet, setLocationSet] = React.useState(false);
  const [locationLoading, setLocationLoading] = React.useState(false);

  const handleToggleNotifications = async () => {
    const nextVal = !settings.notifications;
    setSettings((prev) => ({ ...prev, notifications: nextVal }));
    if (!nextVal) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } else {
      await Notifications.requestPermissionsAsync();
    }
  };

  const handleSetLocation = async () => {
    if (locationSet) return;
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        await Location.getCurrentPositionAsync({});
        setLocationSet(true);
        setSettings((prev) => ({ ...prev, locationServices: true }));
      } else {
        setSettings((prev) => ({ ...prev, locationServices: false }));
      }
    } catch {
      setSettings((prev) => ({ ...prev, locationServices: false }));
    }
    setLocationLoading(false);
  };

  const handleToggleLocation = async () => {
    if (!locationSet) await handleSetLocation();
  };

  const textTitleColor = '#036672';
  const itemBg = '#fff';
  const labelColor = '#00695c';
  const descColor = '#02746b';
  const backBtnBg = '#e0f2f1';
  const backBtnColor = '#279b8f';
  const geriTextColor = '#028383';

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: '#f9fafb' },
      ]}
      edges={['top']}
    >
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingTop: 8,
        }}
      >
        <Text
          onPress={() => require('expo-router').router.back()}
          style={{
            backgroundColor: backBtnBg,
            borderRadius: 99,
            padding: 9,
            paddingRight: 13,
            paddingLeft: 8,
            fontSize: 19,
            color: backBtnColor,
          }}
          suppressHighlighting={true}
        >
          {isRTL ? '›' : '‹'}
        </Text>
        <Text
          style={{
            fontSize: 17,
            fontWeight: '500',
            marginHorizontal: 4,
            color: geriTextColor,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {t('common.back')}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.pageTitle, { color: textTitleColor }]}>{t('settings.title')}</Text>
        <ScrollView contentContainerStyle={styles.settingsList}>
          <View
            style={[
              styles.blockCard,
              { backgroundColor: itemBg, borderColor: '#e0f2f1', shadowColor: '#03667222' },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: labelColor }]}>{t('settings.languageTitle')}</Text>
            <Text style={[styles.languageHint, { color: descColor }]}>{t('settings.languageHint')}</Text>
            <LanguageShortcutsBar
              variant="surface"
              locale={locale}
              onSelect={setLocale}
              isRTL={isRTL}
            />
          </View>

          <View
            style={[
              styles.settingItem,
              {
                backgroundColor: itemBg,
                borderColor: '#e0f2f1',
                shadowColor: '#03667222',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: labelColor }]}>
                {t('settings.notificationsLabel')}
              </Text>
              <Text style={[styles.settingDesc, { color: descColor }]}>
                {t('settings.notificationsDesc')}
              </Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={handleToggleNotifications}
              thumbColor={settings.notifications ? '#21E7D8' : '#cfd8dc'}
              trackColor={{ false: '#b2dfdb', true: '#4dd0e1' }}
            />
          </View>

          <View
            style={[
              styles.settingItem,
              {
                backgroundColor: itemBg,
                borderColor: '#e0f2f1',
                shadowColor: '#03667222',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: labelColor }]}>
                {t('settings.locationLabel')}
              </Text>
              <Text style={[styles.settingDesc, { color: descColor }]}>
                {locationSet
                  ? t('settings.locationSuccess')
                  : locationLoading
                    ? t('settings.locationLoading')
                    : t('settings.locationDesc')}
              </Text>
            </View>
            <Switch
              value={locationSet || settings.locationServices}
              onValueChange={handleToggleLocation}
              thumbColor={(locationSet || settings.locationServices) ? '#21E7D8' : '#cfd8dc'}
              trackColor={{ false: '#b2dfdb', true: '#4dd0e1' }}
              disabled={locationSet || locationLoading}
            />
          </View>
        </ScrollView>
        <BottomNavBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 25,
    fontWeight: '800',
    paddingTop: 32,
    marginBottom: 20,
    textAlign: 'center',
  },
  settingsList: { paddingHorizontal: 18, paddingBottom: 80, gap: 16 },
  blockCard: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'column',
    alignItems: 'stretch',
    elevation: 1,
    shadowColor: '#03667222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#e0f2f1',
    marginBottom: 2,
  },
  sectionLabel: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  languageHint: { fontSize: 12, opacity: 0.85, marginBottom: 8 },
  settingItem: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#03667222',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#e0f2f1',
    marginBottom: 2,
  },
  settingLabel: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  settingDesc: { fontSize: 13, opacity: 0.75 },
});
