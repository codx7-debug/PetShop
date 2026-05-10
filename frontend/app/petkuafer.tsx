import React, { useState, useMemo } from 'react';
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

import { groomersForLocale, type DemoGroomer } from '../i18n/listingDemoCatalog';

const PetKuaferPage: React.FC = () => {
  const { t, locale } = useLanguage();
  const [selectedGroomer, setSelectedGroomer] = useState<DemoGroomer | null>(null);
  const groomers = useMemo(() => groomersForLocale(locale), [locale]);

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
            {t('listingGroomer.searchPlaceholder')}
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
        <TouchableOpacity
          style={styles.liveProvidersBanner}
          activeOpacity={0.9}
          onPress={() =>
            router.push({ pathname: '/browse-services', params: { orgType: 'salon' } })
          }
        >
          <Text style={styles.liveProvidersTitle}>{t('listingGroomer.browseRealProviders')}</Text>
          <Text style={styles.liveProvidersSub}>{t('listingGroomer.browseRealProvidersSub')}</Text>
          <Text style={styles.liveProvidersCta}>{t('listingGroomer.partnerCta')} →</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('listingGroomer.pageTitle')}</Text>
        <View style={styles.listContainer}>
          {groomers.map(groomer => (
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
                <Text style={styles.groomerPriceSmall}>₺{groomer.price}{t('listingGroomer.perSession')}</Text>
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
                  <Text style={styles.sectionTitle}>{t('listingGroomer.about')}</Text>
                  <Text style={styles.description}>{selectedGroomer.description}</Text>
                  <Text style={styles.sectionTitle}>{t('listingGroomer.services')}</Text>
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
                      <Text style={styles.perSession}>{t('listingGroomer.perSession')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.reserveButton}
                      onPress={() => {
                        setSelectedGroomer(null);
                        router.push({ pathname: '/browse-services', params: { orgType: 'salon' } });
                      }}
                    >
                      <Text style={styles.reserveButtonText}>{t('listingGroomer.reserve')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.cancelNote}>{t('listingGroomer.cancelNote')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setSelectedGroomer(null)}
                  >
                    <Text style={styles.closeModalText}>{t('listingGroomer.close')}</Text>
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
  liveProvidersBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  liveProvidersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#581c87',
  },
  liveProvidersSub: {
    fontSize: 13,
    color: '#6b21a8',
    marginTop: 6,
    lineHeight: 18,
  },
  liveProvidersCta: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7c3aed',
    marginTop: 10,
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