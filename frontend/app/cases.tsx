import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNavBar from './bottomNavBar';
import { useLanguage } from '../contexts/LanguageContext';

type CaseStatus = 'critical' | 'missing';

type CaseItem = {
  id: string;
  title: string;
  location: string;
  distance: string;
  status: CaseStatus;
  statusLabel: string;
  time: string;
  description: string;
  image: string;
  comments: { id: string; user: string; text: string; time: string; avatar: string }[];
};

function buildCasesData(t: (k: string, p?: Record<string, string | number>) => string): CaseItem[] {
  return [
    {
      id: '1',
      title: t('cases.c1Title'),
      location: t('cases.c1Location'),
      distance: '1.2',
      status: 'critical',
      statusLabel: t('cases.statusCritical'),
      time: t('cases.c1Time'),
      description: t('cases.c1Desc'),
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
      comments: [
        { id: 'c1', user: t('cases.c1u1'), text: t('cases.c1t1'), time: t('cases.c1m1'), avatar: 'https://i.pravatar.cc/150?u=mert' },
        { id: 'c2', user: t('cases.c1u2'), text: t('cases.c1t2'), time: t('cases.c1m2'), avatar: 'https://i.pravatar.cc/150?u=selin' },
      ],
    },
    {
      id: '2',
      title: t('cases.c2Title'),
      location: t('cases.c2Location'),
      distance: '4.8',
      status: 'missing',
      statusLabel: t('cases.statusMissing'),
      time: t('cases.c2Time'),
      description: t('cases.c2Desc'),
      image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
      comments: [
        { id: 'c3', user: t('cases.c2u1'), text: t('cases.c2t1'), time: t('cases.c2m1'), avatar: 'https://i.pravatar.cc/150?u=caner' },
      ],
    },
  ];
}

export default function CasesScreen() {
  const { t } = useLanguage();
  const CASES_DATA = React.useMemo(() => buildCasesData(t), [t]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('cases.headerTitle')}</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color="#FE6E40" />
          <Text style={styles.filterText}>{t('cases.filter')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {CASES_DATA.map((item) => (
          <View key={item.id} style={styles.caseCard}>
            <View style={styles.row}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.fancyImage} />
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'critical' ? '#FF5252' : '#FE6E40' }]}>
                  <Text style={styles.statusText}>{item.statusLabel}</Text>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.caseTitle}>{item.title}</Text>
                  <Text style={styles.timeLabel}>{item.time}</Text>
                </View>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#FE6E40" />
                  <Text style={styles.locationText}>{item.location} • {item.distance}km</Text>
                </View>
                <Text numberOfLines={3} style={styles.descriptionText}>{item.description}</Text>
              </View>
            </View>

            <View style={styles.commentsWrapper}>
              <Text style={styles.commentCount}>{t('cases.commentCount', { count: item.comments.length })}</Text>
              {item.comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                  <View style={styles.commentBubble}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUser}>{comment.user}</Text>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.replyRow}>
              <TextInput
                placeholder={t('cases.replyPlaceholder')}
                style={styles.replyInput}
                placeholderTextColor="#A0A0A0"
              />
              <TouchableOpacity style={styles.sendBtn}>
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF'
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1A3306', letterSpacing: -0.5 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  filterText: { color: '#FE6E40', fontWeight: '700', marginLeft: 4, fontSize: 13 },
  scrollContent: { paddingBottom: 40 },

  caseCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  row: { flexDirection: 'row' },
  imageContainer: { position: 'relative' },
  fancyImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 35,
    borderBottomRightRadius: 35,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#F1F5F9'
  },
  statusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  statusText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  detailsContainer: { flex: 1, marginLeft: 15 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  caseTitle: { fontSize: 16, fontWeight: '800', color: '#0A2540', flex: 1 },
  timeLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { fontSize: 12, color: '#FE6E40', fontWeight: '700', marginLeft: 4 },
  descriptionText: { fontSize: 13, color: '#64748B', marginTop: 8, lineHeight: 18 },

  commentsWrapper: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  commentCount: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' },
  commentItem: { flexDirection: 'row', marginBottom: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 12, marginRight: 10 },
  commentBubble: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { fontWeight: '700', fontSize: 13, color: '#0A2540' },
  commentTime: { fontSize: 10, color: '#94A3B8' },
  commentText: { fontSize: 13, color: '#475569', lineHeight: 18 },

  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  replyInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#0A2540' },
  sendBtn: {
    backgroundColor: '#FE6E40',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8
  },
});
