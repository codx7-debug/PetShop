import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import BottomNavBar from './bottomNavBar';

const mockSettings = [
  {
    key: 'notifications',
    label: 'Bildirimleri Aç/Kapat',
    description: 'Uygulamadan bildirim al.',
    defaultValue: true,
  },
  // Dark mode removed for now
  {
    key: 'locationServices',
    label: 'Konum Servisleri',
    description: 'Yakındaki klinikleri/satıcıları bulmak için konumunu kullan.',
    defaultValue: true,
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = React.useState(() =>
    Object.fromEntries(mockSettings.map((s) => [s.key, s.defaultValue]))
  );
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

  // Use fixed light colors (dark mode removed)
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
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 8 }}>
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
          {'‹'}
        </Text>
        <Text style={{ fontSize: 17, fontWeight: '500', marginLeft: 4, color: geriTextColor }}>
          Geri
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.pageTitle, { color: textTitleColor }]}>Ayarlar</Text>
        <ScrollView contentContainerStyle={styles.settingsList}>
          {/* NOTIFICATIONS */}
          <View style={[styles.settingItem, { backgroundColor: itemBg, borderColor: '#e0f2f1', shadowColor: '#03667222' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: labelColor }]}>{mockSettings[0].label}</Text>
              <Text style={[styles.settingDesc, { color: descColor }]}>{mockSettings[0].description}</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={handleToggleNotifications}
              thumbColor={settings.notifications ? '#21E7D8' : '#cfd8dc'}
              trackColor={{ false: '#b2dfdb', true: '#4dd0e1' }}
            />
          </View>

          {/* LOCATION */}
          <View style={[styles.settingItem, { backgroundColor: itemBg, borderColor: '#e0f2f1', shadowColor: '#03667222' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: labelColor }]}>{mockSettings[1].label}</Text>
              <Text style={[styles.settingDesc, { color: descColor }]}>
                {locationSet
                  ? 'Konum başarıyla ayarlandı.'
                  : locationLoading
                  ? 'Konum alınırken bekleyiniz...'
                  : mockSettings[1].description}
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
  settingItem: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#03667222', // overridden inline
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#e0f2f1', // overridden inline
    marginBottom: 2,
  },
  settingLabel: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  settingDesc: { fontSize: 13, opacity: 0.75 },
});