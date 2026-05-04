import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from './bottomNavBar';
import { useLanguage } from '../contexts/LanguageContext';
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from '../lib/api';
import { clearUserSession } from "../lib/session";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatCardProps = {
  title: string;
  count: string;
  icon: string;
  color: string;
  iconColor: string;
};

type MenuItemProps = {
  icon: string;
  title: string;
  color: string;
  subtitle?: string;
  onPress?: () => void;
};

type SectionHeaderProps = {
  title: string;
  onEdit?: () => void;
  editLabel?: string;
};

type PetCardProps = {
  name: string;
  breed: string;
  icon: string;
  color: string;
  onPress?: () => void;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ title, count, icon, color, iconColor }: StatCardProps) => {
  return (
    <TouchableOpacity style={[statStyles.statCard, { backgroundColor: color }]} activeOpacity={0.85}>
      <View style={[statStyles.statIconWrap, { backgroundColor: iconColor + '22' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={[statStyles.statCount, { color: '#2b415c' }]}>{count}</Text>
      <Text style={[statStyles.statTitle, { color: '#627ec6' }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const MenuItem = ({ icon, title, color, subtitle, onPress }: MenuItemProps) => {
  return (
    <TouchableOpacity
      style={[menuStyles.menuItem, { borderBottomColor: '#ebedfa' }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={[menuStyles.menuIconBox, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color={'#4361ee'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[menuStyles.menuText, { color: '#2b415c' }]}>{title}</Text>
        {subtitle ? <Text style={[menuStyles.menuSubtext, { color: '#7c859a' }]}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={'#bbc5de'} />
    </TouchableOpacity>
  );
};

const SectionHeader = ({ title, onEdit, editLabel }: SectionHeaderProps) => {
  return (
    <View style={sectionStyles.sectionHeader}>
      <Text style={[sectionStyles.sectionTitle, { color: '#2b415c' }]}>{title}</Text>
      {onEdit && editLabel ? (
        <TouchableOpacity onPress={onEdit}>
          <Text style={[sectionStyles.editLink, { color: '#627ec6' }]}>{editLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const PetCard = ({ name, breed, icon, color, onPress }: PetCardProps) => {
  return (
    <TouchableOpacity
      style={[petStyles.petCard, { backgroundColor: color, borderColor: '#ebedfa' }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={[petStyles.petIconBox, { backgroundColor: '#f4f7fe' }]}>
        <Text style={{ fontSize: 26 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[petStyles.petName, { color: '#2b415c' }]}>{name}</Text>
        <Text style={[petStyles.petBreed, { color: '#627ec6' }]}>{breed}</Text>
      </View>
      <View style={[petStyles.petArrow, { backgroundColor: '#edf1fa' }]}>
        <Ionicons name="chevron-forward" size={16} color={'#b3bcd4'} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

type StoredUser = {
  id?: number;
  email?: string;
  full_name?: string | null;
  role?: string;
};

type PetPreview = { id: number; name: string; species?: string | null };

export default function ProfileScreen() {
  const { t } = useLanguage();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [pets, setPets] = useState<PetPreview[]>([]);
  const [loadingMe, setLoadingMe] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  /** Only show stored user when a session token exists; otherwise clear stale `user` from storage. */
  const refreshLocalUser = useCallback(async () => {
    try {
      const tok = await AsyncStorage.getItem('token');
      if (!tok) {
        const stale = await AsyncStorage.getItem('user');
        if (stale) await AsyncStorage.removeItem('user');
        setUser(null);
        setPets([]);
        setHasToken(false);
        return;
      }
      setHasToken(true);
      const raw = await AsyncStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw) as StoredUser);
      else setUser(null);
    } catch {
      setUser(null);
      setPets([]);
      setHasToken(false);
    }
  }, []);

  const refreshFromApi = useCallback(async () => {
    const tok = await AsyncStorage.getItem('token');
    if (!tok) {
      await refreshLocalUser();
      return;
    }
    setLoadingMe(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me`, { headers: await getAuthHeaders(false) });
      const parsed = await parseResponseJson<{ user?: StoredUser & Record<string, unknown> }>(res);
      if (parsed.ok && parsed.data?.user) {
        setHasToken(true);
        const u = parsed.data.user;
        const prevRaw = await AsyncStorage.getItem('user');
        const prev = prevRaw ? (JSON.parse(prevRaw) as Record<string, unknown>) : {};
        await AsyncStorage.setItem('user', JSON.stringify({ ...prev, ...u }));
        setUser(u as StoredUser);
        const role = String(u.role || '').toLowerCase();
        if (role === 'user' && u.id != null) {
          const pr = await fetch(`${API_BASE_URL}/api/me/pets`, { headers: await getAuthHeaders(false) });
          const pj = await parseResponseJson<{ pets?: PetPreview[] }>(pr);
          setPets(pj.data?.pets?.slice(0, 4) || []);
        } else {
          setPets([]);
        }
      } else {
        if (res.status === 401) {
          await clearUserSession();
          setHasToken(false);
          setUser(null);
          setPets([]);
        } else {
          await refreshLocalUser();
        }
      }
    } catch {
      await refreshLocalUser();
    } finally {
      setLoadingMe(false);
    }
  }, [refreshLocalUser]);

  useFocusEffect(
    useCallback(() => {
      void refreshLocalUser();
      void refreshFromApi();
    }, [refreshFromApi, refreshLocalUser])
  );

  const displayName = hasToken
    ? user?.full_name?.trim() || user?.email || '—'
    : t('profile.guestName');
  const displayEmail = hasToken ? user?.email || '' : t('profile.guestEmail');
  const isUser = hasToken && String(user?.role || '').toLowerCase() === 'user';

  const openSignIn = () => {
    router.push({ pathname: '/login', params: { signInUser: '1' } });
  };

  const goOrLogin = (path: '/profile-edit' | '/profile-password' | '/profile-payments' | '/profile-address' | '/profile-notifications' | '/profile-pets') => {
    if (hasToken) router.push(path);
    else openSignIn();
  };

  const logout = async () => {
    await clearUserSession();
    if (router.canDismiss()) router.dismissAll();
    router.replace({ pathname: '/login', params: { signInUser: '1' } });
  };

  return (
    <SafeAreaView style={[mainStyles.container, { backgroundColor: '#f4f7fe' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={mainStyles.scroll}>
        {/* Header */}
        <View style={mainStyles.header}>
          <TouchableOpacity
            style={[mainStyles.backBtn, { backgroundColor: '#edf1fa', borderColor: '#4361ee' }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#627ec6" />
          </TouchableOpacity>
          <Text style={[mainStyles.headerTitle, { color: '#2b415c' }]}>{t('profile.title')}</Text>
          <TouchableOpacity
            style={[mainStyles.settingsBtn, { backgroundColor: '#edf1fa', borderColor: '#4361ee' }]}
            onPress={() => router.push('/Settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#627ec6" />
          </TouchableOpacity>
        </View>

        {/* User info */}
        <View style={[
          mainStyles.profileSection,
          {
            backgroundColor: '#fff',
            borderColor: '#4361ee',
            shadowColor: '#627ec6',
          }
        ]}>
          <View style={mainStyles.avatarContainer}>
            <View style={[mainStyles.avatarGlow, { backgroundColor: '#4278f6' }]} />
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' }}
              style={mainStyles.avatar}
            />
            <TouchableOpacity style={[mainStyles.editAvatarBtn, { backgroundColor: '#627ec6', borderColor: '#fff' }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          {loadingMe && hasToken ? (
            <ActivityIndicator style={{ marginVertical: 8 }} color="#627ec6" />
          ) : null}
          <Text style={[mainStyles.userName, { color: '#2b415c' }]}>{displayName}</Text>
          <Text style={[mainStyles.userEmail, { color: '#627ec6' }]}>{displayEmail || '—'}</Text>
          {!hasToken ? (
            <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 8, paddingHorizontal: 12 }}>
              {t('profile.guestHint')}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              mainStyles.editProfileBtn,
              { borderColor: '#627ec6', backgroundColor: '#f7f6ff' }
            ]}
            activeOpacity={0.85}
            onPress={() => goOrLogin('/profile-edit')}
          >
            <Ionicons name={hasToken ? 'create-outline' : 'log-in-outline'} size={15} color="#627ec6" style={{ marginRight: 5 }} />
            <Text style={[mainStyles.editProfileText, { color: '#627ec6' }]}>
              {hasToken ? t('profile.editProfile') : t('profile.signIn')}
            </Text>
          </TouchableOpacity>
        </View>

        {isUser ? (
          <>
            <SectionHeader
              title={t('profile.petsSection')}
              onEdit={() => goOrLogin('/profile-pets')}
              editLabel={t('profile.petsManage')}
            />
            <View style={petStyles.petsContainer}>
              {pets.length === 0 ? (
                <TouchableOpacity style={petStyles.addPetBtn} onPress={() => goOrLogin('/profile-pets')}>
                  <View style={[petStyles.addPetIcon, { backgroundColor: '#edf1fa' }]}>
                    <Ionicons name="paw" size={22} color="#4361ee" />
                  </View>
                  <Text style={[petStyles.addPetText, { color: '#2b415c' }]}>{t('profile.petsManage')}</Text>
                </TouchableOpacity>
              ) : (
                pets.map((p) => (
                  <PetCard
                    key={p.id}
                    name={p.name}
                    breed={[p.species, p.breed].filter(Boolean).join(' · ') || 'Pet'}
                    icon="🐾"
                    color="#fff"
                    onPress={() => goOrLogin('/profile-pets')}
                  />
                ))
              )}
            </View>
          </>
        ) : null}

        {/* Account settings */}
        <SectionHeader title={t('profile.accountSection')} />
        <View style={[
          menuStyles.menuList,
          {
            backgroundColor: '#fff',
            borderColor: '#4361ee',
            shadowColor: '#627ec6',
          }
        ]}>
          <MenuItem
            icon="person-outline"
            title={t('profile.menuPersonal')}
            subtitle={t('profile.menuPersonalSub')}
            color="#f5f0fe"
            onPress={() => goOrLogin('/profile-edit')}
          />
          <MenuItem
            icon="key-outline"
            title={t('profile.menuPassword')}
            subtitle={t('profile.menuPasswordSub')}
            color="#fef3c7"
            onPress={() => goOrLogin('/profile-password')}
          />
          <MenuItem
            icon="card-outline"
            title={t('profile.menuPayment')}
            subtitle={t('profile.menuPaymentSub')}
            color="#e9fbff"
            onPress={() => goOrLogin('/profile-payments')}
          />
          <MenuItem
            icon="location-outline"
            title={t('profile.menuAddress')}
            subtitle={t('profile.menuAddressSub')}
            color="#fff6e9"
            onPress={() => goOrLogin('/profile-address')}
          />
          <MenuItem
            icon="notifications-outline"
            title={t('profile.menuNotifications')}
            subtitle={t('profile.menuNotificationsSub')}
            color="#ecf7fb"
            onPress={() => goOrLogin('/profile-notifications')}
          />
        </View>

        {/* Logout / Sign in */}
        <TouchableOpacity
          style={[
            mainStyles.logoutBtn,
            { backgroundColor: '#f5f4f8', borderColor: '#e1e0e6' }
          ]}
          activeOpacity={0.85}
          onPress={() => (hasToken ? void logout() : openSignIn())}
        >
          <Ionicons
            name={hasToken ? 'log-out-outline' : 'log-in-outline'}
            size={18}
            color={hasToken ? '#c5295b' : '#4361ee'}
            style={{ marginRight: 8 }}
          />
          <Text style={[mainStyles.logoutText, { color: '#2b415c' }]}>
            {hasToken ? t('profile.logout') : t('profile.signIn')}
          </Text>
        </TouchableOpacity>

        {/* Add extra space so the logout button can be scrolled above BottomNavBar */}
        <View style={{ height: 120 }} />
      </ScrollView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

// ─── Styles (static colors) ─

const mainStyles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 24,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 0.5,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    width: 110,
    height: 110,
    marginBottom: 14,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#f4f7fe',
  },
  avatarGlow: {
    position: 'absolute',
    top: 6,
    bottom: -6,
    left: 6,
    right: -6,
    opacity: 0.18,
    borderRadius: 32,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  userEmail: {
    fontSize: 13,
    marginTop: 3,
    marginBottom: 14,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: {
    fontWeight: '700',
    fontSize: 15,
  },
});

const statStyles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    alignItems: 'center',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 0.5,
  },
  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
  },
  statTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },
});

const sectionStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 26,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  editLink: {
    fontWeight: '600',
    fontSize: 13,
  },
});

const menuStyles = StyleSheet.create({
  menuList: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 0.5,
    overflow: 'hidden',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuSubtext: {
    fontSize: 11,
    marginTop: 1,
  },
});

const petStyles = StyleSheet.create({
  petsContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 0.5,
  },
  petIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  petName: {
    fontSize: 15,
    fontWeight: '700',
  },
  petBreed: {
    fontSize: 12,
    marginTop: 2,
  },
  petArrow: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addPetIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addPetText: {
    fontSize: 14,
    fontWeight: '600',
  },
});