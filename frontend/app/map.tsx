import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform, ActivityIndicator, Alert, TextInput, Keyboard } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

// Mock clinic store data with lat/lng, name, and optionally address
const CLINIC_STORES = [
  {
    id: 1,
    name: "VetCare Clinic - Kızılay",
    latitude: 39.9225,
    longitude: 32.8545,
    address: "Atatürk Blv No:205, Ankara"
  },
  {
    id: 2,
    name: "Pet Health Clinic - Bahçelievler",
    latitude: 39.9250,
    longitude: 32.8501,
    address: "Bahçelievler 3. Cadde, Ankara"
  },
  {
    id: 3,
    name: "Ankara Animal Hospital",
    latitude: 39.9405,
    longitude: 32.8635,
    address: "Tunali Hilmi Cd. No:89, Ankara"
  },
  {
    id: 4,
    name: "College Vet Clinic",
    latitude: 39.9325,
    longitude: 32.8693,
    address: "Kolej Sk. No:12, Ankara"
  },
  {
    id: 5,
    name: "GreenPaws Clinic",
    latitude: 39.9204,
    longitude: 32.8609,
    address: "Güvenpark, Ankara"
  },
];

// Haversine distance utility
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  function toRad(x: number) {
    return x * Math.PI / 180;
  }
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ClinicStoreMap() {
  const defaultLocation = { latitude: 39.9334, longitude: 32.8597 };
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [nearestStore, setNearestStore] = useState<typeof CLINIC_STORES[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView | null>(null);

  // --- Search Feature ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStores, setFilteredStores] = useState(CLINIC_STORES);

  // Filter stores based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStores(CLINIC_STORES);
      return;
    }
    const lower = searchQuery.trim().toLowerCase();
    setFilteredStores(CLINIC_STORES.filter(
      s =>
        s.name.toLowerCase().includes(lower) ||
        (s.address && s.address.toLowerCase().includes(lower))
    ));
  }, [searchQuery]);

  // Find closest clinic store
  useEffect(() => {
    if (userLocation) {
      let minDist = Number.POSITIVE_INFINITY;
      let nearest = null;
      for (const s of filteredStores) {
        const dist = getDistance(userLocation.latitude, userLocation.longitude, s.latitude, s.longitude);
        if (dist < minDist) {
          minDist = dist;
          nearest = s;
        }
      }
      setNearestStore(nearest);
    }
  }, [userLocation, filteredStores]);

  // On mount: get user location
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Location required", "Please enable location to find nearby clinic stores.");
          setUserLocation(defaultLocation);
        } else {
          const loc = await Location.getCurrentPositionAsync({});
          if (isMounted && loc?.coords?.latitude && loc?.coords?.longitude) {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            });
            if (mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.018,
                longitudeDelta: 0.018
              }, 1000);
            }
          }
        }
      } catch (e) {
        setUserLocation(defaultLocation);
      } finally {
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  if (loading || !userLocation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }]}>
        <ActivityIndicator size="large" color="#2B9B7A" />
        <Text style={{ marginTop: 14, color: "#2B9B7A", fontSize: 16 }}>Finding your location...</Text>
      </View>
    );
  }

  // Map markers: user and search-filtered clinic stores
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={21} color="#88C6B1" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clinic name or address"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#A3BFC9"
          returnKeyType="search"
          onSubmitEditing={Keyboard.dismiss}
        />
        {searchQuery.length > 0 &&
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#B7D5BC" style={{ marginLeft: 9 }} />
          </TouchableOpacity>
        }
      </View>
  
 
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.028,
          longitudeDelta: 0.028
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User Marker */}
        <Marker
          coordinate={userLocation}
          title="You are here"
          pinColor="#2B9B7A"
          tracksViewChanges={false}
        >
          <View style={styles.userMarkerCore}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        </Marker>
        {/* Clinic Store Markers */}
        {filteredStores.map((store) => (
          <Marker
            key={store.id}
            coordinate={{ latitude: store.latitude, longitude: store.longitude }}
            title={store.name}
            description={store.address}
            pinColor={
              nearestStore && store.id === nearestStore.id ? "#F8004B" : "#317AF5"
            }
            tracksViewChanges={false}
          >
            <View style={[
              styles.storeMarkerCore,
              nearestStore && store.id === nearestStore.id ? styles.nearestHighlight : null
            ]}>
              <Ionicons name="medkit" size={16} color="#fff" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Back Button */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#3B6811" />
        </TouchableOpacity>
      </View>
 

      {/* Info Card for nearest clinic store */}
      <View style={styles.overlay}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nearest Clinic</Text>
          {nearestStore ? (
            <>
              <Text style={styles.storeName}>{nearestStore.name}</Text>
              <Text style={styles.addressTxt}>{nearestStore.address}</Text>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => {
                  if (mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: nearestStore.latitude,
                      longitude: nearestStore.longitude,
                      latitudeDelta: 0.012,
                      longitudeDelta: 0.012
                    }, 900);
                  }
                }}
              >
                <Text style={styles.confirmBtnText}>Show on Map</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ color: "#666", marginVertical: 5 }}>No clinics found nearby.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3fcf8',
    borderRadius: 15,
    borderWidth: 1.6,
    borderColor: '#b2edd7',
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    marginHorizontal: 14,
    marginTop: Platform.OS === 'ios' ? 58 : 34,
    marginBottom: 2,
    zIndex: 20,
    shadowColor: "#3ceadf",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16.5,
    paddingVertical: 3,
    color: "#104B2E"
  },
  
  map: {
    width: width,
    height: height,
    marginTop: 0, // Make room for search bar
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 140 : 76, // Move it below the search bar
    left: 10,
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 10, // default zIndex
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B6811',
    marginBottom: 6,
  },
  storeName: {
    fontWeight: '700',
    fontSize: 15,
    color: "#1A285A",
    marginBottom: 2,
  },
  addressTxt: {
    fontSize: 13.1,
    color: "#7B7C81",
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: '#2B9B7A',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 7,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  userMarkerCore: {
    width: 32,
    height: 32,
    backgroundColor: '#2B9B7A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  storeMarkerCore: {
    width: 30,
    height: 30,
    backgroundColor: '#317AF5',
    borderRadius: 15,
    borderWidth: 2.2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  nearestHighlight: {
    backgroundColor: '#F8004B',
    borderColor: "#FDE7EF"
  },
});