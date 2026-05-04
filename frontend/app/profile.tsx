import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavBar from './bottomNavBar';
import { useLanguage } from '../contexts/LanguageContext';

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

const MenuItem = ({ icon, title, color, subtitle }: MenuItemProps) => {
  return (
    <TouchableOpacity style={[menuStyles.menuItem, { borderBottomColor: '#ebedfa' }]} activeOpacity={0.75}>
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

const PetCard = ({ name, breed, icon, color }: PetCardProps) => {
  return (
    <TouchableOpacity style={[petStyles.petCard, { backgroundColor: color, borderColor: '#ebedfa' }]} activeOpacity={0.85}>
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

export default function ProfileScreen() {
  const { t } = useLanguage();
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
          <Text style={[mainStyles.userName, { color: '#2b415c' }]}>Ayşe Yılmaz</Text>
          <Text style={[mainStyles.userEmail, { color: '#627ec6' }]}>ayseyilmaz@gmail.com</Text>

          <TouchableOpacity
            style={[
              mainStyles.editProfileBtn,
              { borderColor: '#627ec6', backgroundColor: '#f7f6ff' }
            ]}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={15} color="#627ec6" style={{ marginRight: 5 }} />
            <Text style={[mainStyles.editProfileText, { color: '#627ec6' }]}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        </View>

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
          <MenuItem icon="person-outline"   title={t('profile.menuPersonal')}    subtitle={t('profile.menuPersonalSub')} color="#f5f0fe" />
          <MenuItem icon="card-outline"     title={t('profile.menuPayment')}   subtitle={t('profile.menuPaymentSub')}        color="#e9fbff" />
          <MenuItem icon="location-outline" title={t('profile.menuAddress')}         subtitle={t('profile.menuAddressSub')}            color="#fff6e9" />
          <MenuItem icon="notifications-outline" title={t('profile.menuNotifications')}   subtitle={t('profile.menuNotificationsSub')}  color="#ecf7fb" />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[
            mainStyles.logoutBtn,
            { backgroundColor: '#f5f4f8', borderColor: '#e1e0e6' }
          ]}
          activeOpacity={0.85}
          onPress={() => router.replace('/login')}
        >
          <Ionicons name="log-out-outline" size={18} color="#c5295b" style={{ marginRight: 8 }} />
          <Text style={[mainStyles.logoutText, { color: '#2b415c' }]}>{t('profile.logout')}</Text>
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