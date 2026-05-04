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
import { useLanguage } from '../contexts/LanguageContext';
import { router } from 'expo-router';

interface Hotel {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  description: string;
  image: string;
  amenities: string[];
  rating: number;
}

// 5 static hotels
const HOTELS: Hotel[] = [
  {
    id: '1',
    name: 'Dream Pet Hotel',
    location: 'Beşiktaş, İstanbul',
    pricePerNight: 980,
    description:
      "Your pet's home away from home! Premium comfort, 24/7 care, and plenty of cuddles await your furry friend at Dream Pet Hotel. Spacious rooms, a playground, and attention to hygiene & diet.",
    image:
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=750&q=80',
    amenities: [
      'Pet Grooming',
      'Veterinary on Site',
      'Daily Exercise',
      'Play Yard',
      'Spa & Massage',
      '24/7 Supervision',
      'Allergy-safe Foods',
    ],
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Happy Paws Inn',
    location: 'Kadıköy, İstanbul',
    pricePerNight: 725,
    description:
      "A cozy getaway for pets! Indoor/outdoor play areas, nutritious meals, and a dedicated caring staff. Convenient location and safe, clean environment guaranteed.",
    image:
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=750&q=80',
    amenities: [
      'Veterinary On Call',
      'Large Play Area',
      'Pet Taxi',
      'Special Diets',
    ],
    rating: 4.5,
  },
  {
    id: '3',
    name: 'Royal Pet Resort',
    location: 'Şişli, İstanbul',
    pricePerNight: 1100,
    description:
      "Luxury experience for your pet! Individual suites, spa, grooming, and a play pool. Your pet will never want to leave Royal Pet Resort.",
    image:
      'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=750&q=80',
    amenities: [
      'Luxury Suites',
      'Pet Spa',
      'Pool',
      '24/7 Surveillance',
      'Playground',
    ],
    rating: 4.9,
  },
  {
    id: '4',
    name: 'PetCare Hotel',
    location: 'Ataşehir, İstanbul',
    pricePerNight: 580,
    description:
      "Affordable comfort for pets. Attentive care, playtime, group and solo sleep options, regular vet checks.",
    image:
      'https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=750&q=80',
    amenities: [
      'Supervised Play',
      'Regular Vet Checks',
      'Flexible Pickup',
    ],
    rating: 4.3,
  },
  {
    id: '5',
    name: 'City Pet Suites',
    location: 'Bakırköy, İstanbul',
    pricePerNight: 880,
    description:
      "Modern pet suites with video monitoring, allergen-free rooms, play compounds, and nutritional plans tailored for every guest.",
    image:
      'https://images.unsplash.com/photo-1518715308788-3005759c61fc?auto=format&fit=crop&w=750&q=80',
    amenities: [
      'Video Monitoring',
      'Allergy Free',
      'Custom Nutrition',
      'Training',
    ],
    rating: 4.6,
  },
];

const HotelPage: React.FC = () => {
  const { t } = useLanguage();
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

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
            {t('listingHotel.searchPlaceholder')}
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
          <Text style={{ fontSize: 20, color: '#fca311' }}>⏳</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.liveProvidersBanner}
          activeOpacity={0.9}
          onPress={() =>
            router.push({ pathname: '/browse-services', params: { orgType: 'hotel' } })
          }
        >
          <Text style={styles.liveProvidersTitle}>{t('listingHotel.browseRealProviders')}</Text>
          <Text style={styles.liveProvidersSub}>{t('listingHotel.browseRealProvidersSub')}</Text>
          <Text style={styles.liveProvidersCta}>{t('listingHotel.partnerCta')} →</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('listingHotel.pageTitle')}</Text>
        <View style={styles.listContainer}>
          {HOTELS.map(hotel => (
            <TouchableOpacity
              key={hotel.id}
              style={styles.hotelCard}
              activeOpacity={0.85}
              onPress={() => setSelectedHotel(hotel)}
            >
              <Image source={{ uri: hotel.image }} style={styles.hotelImgThumb} />
              <View style={styles.infoCol}>
                <Text style={styles.hotelNameSmall}>{hotel.name}</Text>
                <Text style={styles.hotelLocSmall} numberOfLines={1}>📍 {hotel.location}</Text>
                <Text style={styles.hotelPriceSmall}>₺{hotel.pricePerNight}{t('listingHotel.perNight')}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingValue}>{hotel.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal for hotel details */}
      <Modal
        visible={!!selectedHotel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedHotel(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedHotel && (
              <ScrollView 
                contentContainerStyle={{ paddingBottom: 24 }} 
                style={{ flexGrow: 0 }} 
                showsVerticalScrollIndicator={false}
              >
                <Image source={{ uri: selectedHotel.image }} style={styles.largeImage} />
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.modalHotelName}>{selectedHotel.name}</Text>
                  <Text style={styles.modalHotelLocation}>📍 {selectedHotel.location}</Text>
                  <View style={styles.ratingRowModal}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingValue}>{selectedHotel.rating}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>{t('listingHotel.about')}</Text>
                  <Text style={styles.description}>{selectedHotel.description}</Text>
                  <Text style={styles.sectionTitle}>{t('listingHotel.features')}</Text>
                  <View style={styles.amenitiesContainer}>
                    {selectedHotel.amenities.map((a, idx) => (
                      <View key={idx} style={styles.amenityBadge}>
                        <Text style={styles.amenityText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.bookingCard}>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₺{selectedHotel.pricePerNight}</Text>
                      <Text style={styles.perNight}>{t('listingHotel.perNight')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.reserveButton}
                      onPress={() => {
                        setSelectedHotel(null);
                        router.push({ pathname: '/browse-services', params: { orgType: 'hotel' } });
                      }}
                    >
                      <Text style={styles.reserveButtonText}>{t('listingHotel.reserve')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.cancelNote}>{t('listingHotel.cancelNote')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setSelectedHotel(null)}
                  >
                    <Text style={styles.closeModalText}>{t('listingHotel.close')}</Text>
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
    paddingTop: 32, // Moves content down a little bit
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  liveProvidersBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  liveProvidersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9a3412',
  },
  liveProvidersSub: {
    fontSize: 13,
    color: '#c2410c',
    marginTop: 6,
    lineHeight: 18,
  },
  liveProvidersCta: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ea580c',
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '800',
    marginVertical: 20,
    color: '#22223b',
    marginLeft: 16,
  },
  listContainer: {
    paddingHorizontal: 12,
    gap: 15,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#22223b88',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 14,
  },
  hotelImgThumb: {
    height: 76,
    width: 76,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  hotelNameSmall: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1c274c',
    marginBottom: 2,
  },
  hotelLocSmall: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 3,
    fontWeight: '500',
  },
  hotelPriceSmall: {
    fontSize: 15,
    color: '#ea580c',
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
    color: '#6366f1',
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
  modalHotelName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#22223b',
    marginBottom: 2,
    marginTop: 10,
  },
  modalHotelLocation: {
    color: '#646b7b',
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
    color: '#22223b',
    marginBottom: 8,
    marginTop: 10,
  },
  description: {
    color: '#444',
    lineHeight: 21,
    fontSize: 14,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  amenityBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 11,
    marginBottom: 5,
  },
  amenityText: {
    color: '#0369a1',
    fontWeight: '500',
    fontSize: 13,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    shadowColor: '#4338ca22',
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
    color: '#22223b',
  },
  perNight: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 5,
  },
  reserveButton: {
    backgroundColor: '#4f46e5',
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
    backgroundColor: '#ede9fe',
    borderRadius: 9,
  },
  closeModalText: {
    color: '#5b21b6',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default HotelPage;