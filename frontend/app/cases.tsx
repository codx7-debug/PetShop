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


// --- DATA MOCKUP ---
const CASES_DATA = [
  {
    id: '1',
    title: 'Yaralı Kedi (Acil)',
    location: 'Beşiktaş, İstanbul',
    distance: '1.2',
    status: 'KRİTİK',
    time: '12dk önce',
    description: 'Beşiktaş çarşı tarafında ayağından yaralı bir kedi bulundu. Acil veteriner desteği ve nakil gerekiyor.',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
    comments: [
      { id: 'c1', user: 'Mert Demir', text: 'Kafesimle yoldayım, 10 dakikaya oradayım.', time: '5dk önce', avatar: 'https://i.pravatar.cc/150?u=mert' },
      { id: 'c2', user: 'Selin Ak', text: 'En yakın klinik Petora Veteriner, bilgi verildi mi?', time: '2dk önce', avatar: 'https://i.pravatar.cc/150?u=selin' }
    ]
  },
  {
    id: '2',
    title: 'Kayıp Golden Retriever',
    location: 'Kadıköy, Moda',
    distance: '4.8',
    status: 'KAYIP',
    time: '1s önce',
    description: 'Moda sahil civarında tasmasız gezen bir köpek görüldü. Çok uysal ama korkmuş görünüyor.',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
    comments: [
      { id: 'c3', user: 'Caner Y.', text: 'Sahibini tanıyorum, haber verdim!', time: '10dk önce', avatar: 'https://i.pravatar.cc/150?u=caner' }
    ]
  }
];

export default function CasesScreen() {
  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yardım Vakaları</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color="#FE6E40" />
          <Text style={styles.filterText}>Filtrele</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {CASES_DATA.map((item) => (
          <View key={item.id} style={styles.caseCard}>
            
            {/* CASE MAIN INFO */}
            <View style={styles.row}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.fancyImage} />
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'KRİTİK' ? '#FF5252' : '#FE6E40' }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
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

            {/* COMMENTS SECTION */}
            <View style={styles.commentsWrapper}>
              <Text style={styles.commentCount}>{item.comments.length} Yorum</Text>
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

            {/* QUICK REPLY INPUT */}
            <View style={styles.replyRow}>
              <TextInput 
                placeholder="Yardımcı ol..." 
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
      <BottomNavBar/>
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
    borderTopLeftRadius: 35, // The Petora Leaf Shape
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
    borderTopLeftRadius: 2 
  },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  commentUser: { fontSize: 13, fontWeight: '700', color: '#1A3306' },
  commentTime: { fontSize: 10, color: '#CBD5E1' },
  commentText: { fontSize: 13, color: '#475569', lineHeight: 17 },

  replyRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    backgroundColor: '#F1F5F9', 
    borderRadius: 15, 
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6
  },
  replyInput: { flex: 1, fontSize: 14, color: '#334155', height: 35 },
  sendBtn: { 
    backgroundColor: '#FE6E40', 
    width: 32, 
    height: 32, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});