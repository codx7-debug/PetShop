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

import { clinicsForLocale, type DemoClinic } from '../i18n/listingDemoCatalog';

const PetClinicPage: React.FC = () => {
  const { t, locale } = useLanguage();
  const [selectedClinic, setSelectedClinic] = useState<DemoClinic | null>(null);
  const clinics = useMemo(() => clinicsForLocale(locale), [locale]);

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
            {t('listingClinic.searchPlaceholder')}
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#e0f7fa',
            borderRadius: 10,
            height: 40,
            width: 40,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#4dd0e1',
            elevation: 2,
            shadowColor: '#4dd0e1',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.13,
            shadowRadius: 6,
          }}
          activeOpacity={0.8}
          onPress={() => {
            // TODO: open filter modal or filtering logic
          }}
        >
          <Text style={{ fontSize: 20, color: '#0097a7' }}>⚕️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.liveProvidersBanner}
          activeOpacity={0.9}
          onPress={() =>
            router.push({ pathname: '/browse-services', params: { orgType: 'vet' } })
          }
        >
          <Text style={styles.liveProvidersTitle}>{t('listingClinic.browseRealProviders')}</Text>
          <Text style={styles.liveProvidersSub}>{t('listingClinic.browseRealProvidersSub')}</Text>
          <Text style={styles.liveProvidersCta}>{t('listingClinic.partnerCta')} →</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('listingClinic.pageTitle')}</Text>
        <View style={styles.listContainer}>
          {clinics.map(clinic => (
            <TouchableOpacity
              key={clinic.id}
              style={styles.clinicCard}
              activeOpacity={0.85}
              onPress={() => setSelectedClinic(clinic)}
            >
              <Image source={{ uri: clinic.image }} style={styles.clinicImgThumb} />
              <View style={styles.infoCol}>
                <Text style={styles.clinicNameSmall}>{clinic.name}</Text>
                <Text style={styles.clinicLocSmall} numberOfLines={1}>📍 {clinic.location}</Text>
                <Text style={styles.clinicFeeSmall}>₺{clinic.consultationFee}{t('listingClinic.perVisit')}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingStar}>⭐</Text>
                  <Text style={styles.ratingValue}>{clinic.rating}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modal for clinic details */}
      <Modal
        visible={!!selectedClinic}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedClinic(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedClinic && (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                style={{ flexGrow: 0 }}
                showsVerticalScrollIndicator={false}
              >
                <Image source={{ uri: selectedClinic.image }} style={styles.largeImage} />
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.modalClinicName}>{selectedClinic.name}</Text>
                  <Text style={styles.modalClinicLocation}>📍 {selectedClinic.location}</Text>
                  <View style={styles.ratingRowModal}>
                    <Text style={styles.ratingStar}>⭐</Text>
                    <Text style={styles.ratingValue}>{selectedClinic.rating}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>{t('listingClinic.about')}</Text>
                  <Text style={styles.description}>{selectedClinic.description}</Text>
                  <Text style={styles.sectionTitle}>{t('listingClinic.services')}</Text>
                  <View style={styles.servicesContainer}>
                    {selectedClinic.services.map((s, idx) => (
                      <View key={idx} style={styles.serviceBadge}>
                        <Text style={styles.serviceText}>{s}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.bookingCard}>
                    <View style={styles.priceRow}>
                      <Text style={styles.price}>₺{selectedClinic.consultationFee}</Text>
                      <Text style={styles.perSession}>{t('listingClinic.perVisit')}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.reserveButton}
                      onPress={() => {
                        setSelectedClinic(null);
                        router.push({ pathname: '/browse-services', params: { orgType: 'vet' } });
                      }}
                    >
                      <Text style={styles.reserveButtonText}>{t('listingClinic.reserve')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.cancelNote}>{t('listingClinic.cancelNote')}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeModalBtn}
                    onPress={() => setSelectedClinic(null)}
                  >
                    <Text style={styles.closeModalText}>{t('listingClinic.close')}</Text>
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
    backgroundColor: '#e0f7fa',
    borderWidth: 1,
    borderColor: '#4dd0e1',
  },
  liveProvidersTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#006064',
  },
  liveProvidersSub: {
    fontSize: 13,
    color: '#00838f',
    marginTop: 6,
    lineHeight: 18,
  },
  liveProvidersCta: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00897b',
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: '800',
    marginVertical: 20,
    color: '#036672',
    marginLeft: 16,
  },
  listContainer: {
    paddingHorizontal: 12,
    gap: 15,
  },
  clinicCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#03667255',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#b2dfdb',
    gap: 14,
  },
  clinicImgThumb: {
    height: 76,
    width: 76,
    borderRadius: 12,
    backgroundColor: '#e0f2f1',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  clinicNameSmall: {
    fontSize: 19,
    fontWeight: '700',
    color: '#036672',
    marginBottom: 2,
  },
  clinicLocSmall: {
    fontSize: 13,
    color: '#00838f',
    marginBottom: 3,
    fontWeight: '500',
  },
  clinicFeeSmall: {
    fontSize: 15,
    color: '#009688',
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
    color: '#ffd600',
    marginRight: 3,
    marginTop: 1,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00b8d4',
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
  modalClinicName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#036672',
    marginBottom: 2,
    marginTop: 10,
  },
  modalClinicLocation: {
    color: '#00838f',
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
    backgroundColor: '#b2dfdb',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#036672',
    marginBottom: 8,
    marginTop: 10,
  },
  description: {
    color: '#016176',
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
    backgroundColor: '#b2f5ea',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 11,
    marginBottom: 5,
  },
  serviceText: {
    color: '#00695c',
    fontWeight: '500',
    fontSize: 13,
  },
  bookingCard: {
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    shadowColor: '#00968822',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#4dd0e1',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 11,
  },
  price: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0097a7',
  },
  perSession: {
    fontSize: 13,
    color: '#00838f',
    fontWeight: '600',
    marginLeft: 5,
  },
  reserveButton: {
    backgroundColor: '#00897b',
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
    color: '#4dd0e1',
    marginTop: 8,
  },
  closeModalBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingHorizontal: 30,
    paddingVertical: 9,
    backgroundColor: '#b2dfdb',
    borderRadius: 9,
  },
  closeModalText: {
    color: '#00695c',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default PetClinicPage;