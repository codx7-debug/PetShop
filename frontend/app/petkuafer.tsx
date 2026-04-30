import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from 'react-native';
import BottomNavBar from './bottomNavBar';

interface Groomer {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  image: string;
  services: string[];
  rating: number;
}

// 5 static pet groomers (kuaför)
const GROOMERS: Groomer[] = [
  {
    id: '1',
    name: 'Pati Kuaför',
    location: 'Beşiktaş, İstanbul',
    price: 350,
    description:
      "Sevimli dostlarınıza özel bakım ve şımartıcı tıraş! Hijyen, nazik yaklaşım ve profesyonel kuaför kadrosuyla Pati Kuaför'de kaliteli hizmet sizi bekliyor.",
    image:
      'https://images.unsplash.com/photo-1518715308788-3005759c61fc?auto=format&fit=crop&w=750&q=80',
    services: [
      'Tırnak Kesimi',
      'Banyo & Kurutma',
      'Tüy Tıraşı',
      'Kulak Temizliği',
      'Koku Giderme',
      'Uzman Kadro',
    ],
    rating: 4.7,
  },
  {
    id: '2',
    name: 'Pet Style Studio',
    location: 'Kadıköy, İstanbul',
    price: 420,
    description:
      "Trend tıraş modelleri, organik bakım ürünleri ve spa hizmetleriyle evcil dostunuza butik deneyim. Kedi ve köpekler için özel indirimler mevcut!",
    image:
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=750&q=80',
    services: [
      'Tıraş Tasarımı',
      'Spa Masajı',
      'Parfüm',
      'Cilt Bakımı',
      'Tüy Açıcı',
    ],
    rating: 4.9,
  },
  {
    id: '3',
    name: 'Şık Pati Kuaför',
    location: 'Şişli, İstanbul',
    price: 390,
    description:
      "Evcil hayvanınız için kaliteli ve steril ortamda profesyonel bakım hizmeti! Her türlü tüy yapısına ve hayvana uygun ekipman ile müşteri memnuniyeti.",
    image:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=750&q=80',
    services: [
      'Banyo',
      'Tarama',
      'Köpük Tedavisi',
      'Kedi/Tavşan Kuaförü',
      'Hijyenik Tıraş',
    ],
    rating: 4.5,
  },
  {
    id: '4',
    name: 'Mavi Pati Grooming',
    location: 'Ataşehir, İstanbul',
    price: 320,
    description:
      "Bütçe dostu fiyatlar, deneyimli groomer ekibi. Küçük ve büyük cinsler için konforlu bakım ve tıraş seçenekleri. Düzenli kontrol fırsatı.",
    image:
      'https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=750&q=80',
    services: [
      'Bakım Kontrolü',
      'Dökülen Tüy Temizliği',
      'Küçük Irk Tıraşı',
      'Büyük Irk Tıraşı',
    ],
    rating: 4.2,
  },
  {
    id: '5',
    name: 'Deluxe Pet Güzellik',
    location: 'Bakırköy, İstanbul',
    price: 480,
    description:
      "Lüks bakım, özel şampuanlar ve aksesuarlar. Randevulu servis ve bire bir müşteri yaklaşımı. Tüm hayvan dostlarımıza uygun hizmet!",
    image:
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=750&q=80',
    services: [
      'VIP Bakım',
      'Aksesuar',
      'Organik Şampuan',
      'Fön & Stil',
      'Tüy Yenileme',
    ],
    rating: 4.8,
  },
];

const PetKuaferPage: React.FC = () => {
  const [selectedGroomer, setSelectedGroomer] = useState<Groomer | null>(null);

  return (
    <View style={styles.container}>
      {/* Search bar with filter button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 30, marginBottom: 8 }}>
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f3f4f6',
          borderRadius: 12,
          paddingHorizontal: 12,
          height: 40,
          marginRight: 10,
          borderWidth: 1,
          borderColor: '#e5e7eb',
        }}>
          {/* Magnifier Icon */}
          <Text style={{ fontSize: 17, color: '#94a3b8', marginRight: 6 }}>🔍</Text>
          <Text
            style={{
              fontSize: 15,
              color: '#475569',
              opacity: 0.78,
              flex: 1,
              paddingVertical: 2,
            }}
            numberOfLines={1}
          >
            Kuaför ara...
          </Text>
          {/* This is a static "search bar" UI; replace <Text> above with <TextInput> to make it functional */}
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#fffbe5',
            borderRadius: 10,
            height: 40,
            width: 40,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ffe066',
            elevation: 2,
            shadowColor: '#ffe066',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
          }}
          activeOpacity={0.8}
          onPress={() => {
            // TODO: open filter modal or filtering logic
          }}
        >
          <Text style={{ fontSize: 20, color: '#fca311' }}>✂️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Pet Kuaförler</Text>
        <View style={styles.listContainer}>
          {GROOMERS.map(groomer => (
            <TouchableOpacity
              key={groomer.id}
              style={styles.groomerCard}
              activeOpacity={0.85}
              onPress={() => setSelectedGroomer(groomer)}
            >
              <Image source={{ uri: groomer.image }} style={styles.groomerImgThumb} />
              <View style={styles.infoCol}>
                <Text style={styles.groomerNameSmall}>{groomer.name}</Text>
                <Text style={styles.groomerLocSmall} numberOfLines={1}>📍 {groomer.location}</Text>
                <Text style={styles.groomerPriceSmall}>₺{groomer.price} / seans</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingValue}>{groomer.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal for groomer details */}
      <Modal
        visible={!!selectedGroomer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedGroomer(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedGroomer && (
              <ScrollView 
                contentContainerStyle={{ paddingBottom: 24 }} 
                style={{ flexGrow: 0 }} 
                showsVerticalScrollIndicator={false}
              >
                <Image source={{ uri: selectedGroomer.image }} style={styles.largeImage} />
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.modalGroomerName}>{selectedGroomer.name}</Text>
                  <Text style={styles.modalGroomerLocation}>📍 {selectedGroomer.location}</Text>
                  <View style={styles.ratingRowModal}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingValue}>{selectedGroomer.rating}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Hakkında</Text>
                  <Text style={styles.description}>{selectedGroomer.description}</Text>
                  <Text style={styles.sectionTitle}>Hizmetler</Text>
                  <View style={styles.servicesContainer}>
                    {selectedGroomer.services.map((s, idx) => (
                      <View key={idx} style={styles.serviceBadge}>
                        <Text style={styles.serviceText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.bookingCard}>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₺{selectedGroomer.price}</Text>
                      <Text style={styles.perSession}>/ seans</Text>
                    </View>
                    <TouchableOpacity style={styles.reserveButton}>
                      <Text style={styles.reserveButtonText}>Randevu Al</Text>
                    </TouchableOpacity>
                    <Text style={styles.cancelNote}>
                      Birçok hizmette ücretsiz iptal imkanı vardır.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setSelectedGroomer(null)}
                  >
                    <Text style={styles.closeModalText}>Kapat</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <BottomNavBar/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 32,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '800',
    marginVertical: 20,
    color: '#1a4c33',
    marginLeft: 16,
  },
  listContainer: {
    paddingHorizontal: 12,
    gap: 15,
  },
  groomerCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1a4c3388',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 14,
  },
  groomerImgThumb: {
    height: 76,
    width: 76,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  groomerNameSmall: {
    fontSize: 19,
    fontWeight: '700',
    color: '#124c38',
    marginBottom: 2,
  },
  groomerLocSmall: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 3,
    fontWeight: '500',
  },
  groomerPriceSmall: {
    fontSize: 15,
    color: '#04896c',
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingStar: {
    fontSize: 14,
    color: '#facc15',
    marginRight: 3,
    marginTop: 1,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 0,
    overflow: 'hidden',
  },
  largeImage: {
    width: '100%',
    height: 170,
  },
  modalGroomerName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#124c38',
    marginBottom: 2,
    marginTop: 10,
  },
  modalGroomerLocation: {
    color: '#029772',
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
    marginTop: 0,
  },
  ratingRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
    marginTop: 10,
  },
  description: {
    color: '#444',
    lineHeight: 21,
    fontSize: 14,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  serviceBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 11,
    marginBottom: 5,
  },
  serviceText: {
    color: '#1e6249',
    fontWeight: '500',
    fontSize: 13,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    shadowColor: '#16653422',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 11,
  },
  price: {
    fontSize: 21,
    fontWeight: '800',
    color: '#124c38',
  },
  perSession: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 5,
  },
  reserveButton: {
    backgroundColor: '#16a34a',
    borderRadius: 13,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 8,
  },
  reserveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelNote: {
    fontSize: 11,
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 8,
  },
  closeModalBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 9,
    backgroundColor: '#dcfce7',
    borderRadius: 9,
  },
  closeModalText: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default PetKuaferPage;