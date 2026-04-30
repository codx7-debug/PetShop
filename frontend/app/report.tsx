import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar
} from 'react-native';
import { router } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from "expo-image";
import * as Location from 'expo-location';

// Fancier report screen with updated styles
export default function ReportScreen() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description || !location || !contact) {
      Alert.alert("Missing info", "Please fill in all fields so we can help the animal as quickly as possible.");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise(res => setTimeout(res, 2000)); // Simulated API
      Alert.alert("Success!", "Report submitted. Help is on the way!");
      router.back();
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };
  
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async (source: "gallery" | "camera") => {
    setIsLoading(true);
    try {
      let permissionResult;
      let pickerResult: ImagePicker.ImagePickerResult;

      if (source === "gallery") {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert("Permission Required", "You need to grant photo library access to select images.");
          setIsLoading(false);
          return;
        }
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsMultipleSelection: true,
          quality: 0.8,
        });
        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
          setPhotoUris((prev) => [
            ...prev,
            ...pickerResult.assets!
              .map((asset: ImagePicker.ImagePickerAsset) => asset.uri)
              .filter((uri: string) => uri && !prev.includes(uri)),
          ]);
        }
      } else {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert("Permission Required", "You need to grant camera access to take a photo.");
          setIsLoading(false);
          return;
        }
        pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });
        if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
          const takenUri = pickerResult.assets[0].uri;
          setPhotoUris((prev) => takenUri && !prev.includes(takenUri) ? [...prev, takenUri] : prev);
        }
      }
    } catch (e) {
      Alert.alert("Error", source === "gallery" 
        ? "There was a problem accessing your photo library."
        : "There was a problem accessing your camera.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = () => pickImage("gallery");
  const handleTakePhoto = () => pickImage("camera");

  const handleRemovePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter(item => item !== uri));
  };


  // Generic state and handlers for all values that threw errors:
  const [animalType, setAnimalType] = React.useState<string>('');
  const [injury, setInjury] = React.useState<string>('');
  const [condition, setCondition] = React.useState<string>('');
  const [urgency, setUrgency] = React.useState<string>('');

  // Optionally, some generic handlers if you want to call set* functions in form controls more simply:
  // Example usage: onValueChange={setAnimalType}
  // (Omit if not needed.)
  return (
    <KeyboardAvoidingView 
      style={styles.mainContainer} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      {/* --- Fancy Glassy Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityLabel="Go back"
          accessible
          onPress={() => router.back()}
          style={styles.headerBackBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#066958" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header" accessibilityLabel="New Report">
          New Report
        </Text>
        <View style={{ width: 28 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Glowy Icon header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconGlow}>
            <MaterialCommunityIcons name="paw" size={60} color="#fff" style={{ textShadowColor: '#ff5252', textShadowRadius: 14 }} />
            <MaterialCommunityIcons name="alert-circle" size={26} color="#FFD600" style={{ position: 'absolute', bottom: 3, right: 3 }} />
       
          </View>
          <Text style={styles.title}>🐾 Report a Case</Text>
          <Text style={styles.subtitle}>Provide details to notify nearby clinics and rescuers.</Text>
        </View>

        {/* Upload or Take Picture Section */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Photo</Text>
          <View style={styles.photoButtonRow}>
            <TouchableOpacity
              disabled={isLoading}
              style={[styles.uploadBtn, styles.uploadBtnFancy, isLoading && { opacity: 0.5 }]}
              onPress={handlePickImage}
            >
              <Ionicons name="image-outline" size={22} color="#30AEA9" />
              <Text style={styles.uploadBtnText}>Upload Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadBtn, styles.takeBtnFancy]}
              accessibilityLabel="Take a new photo"
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera-outline" size={22} color="#183362" />
              <Text style={[styles.uploadBtnText, {color: "#183362"}]}>Take Photo</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.photoPreviewGrid}>
            {photoUris.map((uri) => (
              <View key={uri} style={styles.previewContainer}>
                {/* Fancy shadow & border effect */}
                <View style={styles.previewShadow}>
                  <Image
                    source={{ uri }}
                    style={styles.previewImage}
                    accessibilityLabel="Selected photo preview"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleRemovePhoto(uri)}
                  style={styles.removePhotoBtn}
                  accessibilityLabel="Remove photo"
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
  
        <View style={styles.formCard}>
          {/* --- Description Input (Animal type, Visible injury, Condition, Urgency level) --- */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Animal type</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="paw-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder="E.g. Cat, Dog, Bird"
                value={animalType}
                onChangeText={setAnimalType}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Visible injury</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="bandage-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder="Describe the visible injury"
                value={injury}
                onChangeText={setInjury}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Condition (bleeding / unable to move)</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="pulse-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder="E.g. Bleeding, can't move"
                value={condition}
                onChangeText={setCondition}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Urgency level</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="alert-circle-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder="E.g. High, Medium, Low"
                value={urgency}
                onChangeText={setUrgency}
                placeholderTextColor="#9EC4B2"
              />
            </View>
          </View>
 

          {/* --- Location Input --- */}
          <View style={styles.inputWrapper}>
            <View style={styles.locationRow}>
              <Text style={styles.locationLabel}>Location</Text>
              <TouchableOpacity
                onPress={async () => {
                  const { granted } = await Location.requestForegroundPermissionsAsync();
                  if (!granted) {
                    Alert.alert("Permission Denied", "Enable location access in settings.");
                    return;
                  }
                  const loc = await Location.getCurrentPositionAsync({});
                  setLocation(`${loc.coords.latitude}, ${loc.coords.longitude}`);
                }}
                style={styles.locationBtn}
                accessibilityLabel="Use my current location"
              >
                <Ionicons name="locate" size={16} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.locationBtnText}>Use Current Location</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.locationInputRow}>
              <Ionicons name="location-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput, styles.locationInput]}
                placeholder="Street name, landmark, or GPS"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#B6CCD3"
              />
              {/* More location options */}
              <TouchableOpacity
                onPress={() => {
                  router.push("/map");
                }}
                style={styles.locationMoreBtn}
                accessibilityLabel="More location options"
              >
                <Ionicons name="ellipsis-horizontal" size={18} color="#3F7AB8" />
              </TouchableOpacity>
            </View>
          </View>
    
          {/* --- Contact Input --- */}
          {/* <View style={styles.inputWrapper}>
            <Text style={styles.label}>Your Contact Info</Text>
            <View style={[styles.inputContainer, styles.fancyInputContainer]}>
              <Ionicons name="call-outline" size={21} color="#8aa5c6" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.fancyInput]}
                placeholder="Email or phone number"
                value={contact}
                onChangeText={setContact}
                keyboardType="email-address"
                placeholderTextColor="#B6CCD3"
              />
            </View>
          </View> */}
          <TouchableOpacity 
            style={[styles.submitBtn, styles.glowBtn, submitting && styles.disabledBtn]} 
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Submit Report</Text>
                <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Fancy/Animated and colorful/fun CSS ---
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#e7fdf3",
  },
  // Glassy, gradient header bar!
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 46 : 22,
    paddingBottom: 16,
    backgroundColor: 'rgba(55,253,160,0.12)',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    shadowColor: "#55feb2",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 7,
  },
  headerBackBtn: {
    padding: 5,
    marginRight: 8,
    borderRadius: 18,
    backgroundColor: "#d8fff1",
    shadowColor: "#65eac1",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.19,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#066958',
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Bold" : "sans-serif-condensed",
    textShadowColor: "#a0ffe4",
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 65,
  },
  // --- Fancy icon header ---
  iconHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconGlow: {
    backgroundColor: "#36e3ab",
    borderRadius: 36,
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3ffab7",
    shadowRadius: 26,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    marginBottom: 2,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#f3fef9",
  },
  title: {
    fontSize: 29,
    fontWeight: '900',
    color: "#183362",
    marginTop: 12,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Heavy" : "sans-serif-black",
    letterSpacing: 0.6,
    textShadowColor: "#b6f9eb",
    textShadowRadius: 5,
    textShadowOffset: {width: 0, height: 2},
  },
  subtitle: {
    fontSize: 16,
    color: "#226950",
    textAlign: "center",
    marginTop: 9,
    paddingHorizontal: 28,
    lineHeight: 22,
    fontStyle: "italic",
    letterSpacing: 0.25,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 23,
    shadowColor: "#17e489",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 9,
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#bfffe1",
  },
  inputWrapper: {
    marginBottom: 27,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#085A43',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-DemiBold" : "sans-serif-medium"
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f7ed',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#d0f6e4',
    paddingHorizontal: 15,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  inputIcon: {
    marginRight: 10,
    marginLeft: 3,
    opacity: 0.85,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 17,
    color: '#0c5149',
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Regular" : "sans-serif",
    letterSpacing: 0.12,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },
  // Fancy input styles (for glassy effect)
  fancyInput: {
    backgroundColor: "rgba(245,255,250,0.53)",
    borderRadius: 13,
    paddingLeft: 5,
    borderWidth: 1.1,
    borderColor: "#e8fef0",
  },
  fancyInputContainer: {
    borderWidth: 2.2,
    backgroundColor: "#edfaf0",
    borderColor: "#cdf3eb"
  },

  // --- Photo Section --- 
  photoButtonRow: {
    flexDirection: 'row',
    gap: 13,
    marginBottom: 10,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    paddingVertical: 13,
    justifyContent: 'center',
    borderWidth: 1.1,
    borderColor: '#47e7bd',
    marginBottom: 0,
    gap: 8,
    backgroundColor: "#e8fff6",
    shadowColor: "#48bd9e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 1,
  },
  uploadBtnFancy: {
    backgroundColor: '#edfafe',
    borderColor: '#7aecdd',
    shadowColor: "#7aecdd",
    shadowOpacity: 0.16,
    shadowRadius: 9,
  },
  takeBtnFancy: {
    backgroundColor: "#dbeafe",
    borderColor: "#79aeea",
    shadowColor: "#6aa4fa",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  uploadBtnText: {
    color: '#22A48B',
    fontWeight: '800',
    fontSize: 16,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Medium" : "sans-serif-medium",
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  photoPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 6,
  },
  previewContainer: {
    position: 'relative',
    marginRight: 8,
    marginTop: 8,
  },
  previewShadow: {
    borderRadius: 19,
    overflow: 'hidden',
    shadowColor: "#79ead3",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.17,
    shadowRadius: 25,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#d4ffe9",
    backgroundColor: "#f8fffc",
  },
  previewImage: {
    width: 125,
    height: 125,
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#befae7',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 7,
    right: 10,
    backgroundColor: "#2aa694cc",
    borderRadius: 20,
    width: 33,
    height: 33,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1.8,
    borderColor: "#fff",
    shadowColor: "#119369",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 1 },
    elevation: 7,
  },

  // --- Fancy Location Section ---
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
    paddingHorizontal: 0,
  },
  locationLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#085A43',
    marginTop: 11,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-DemiBold" : "sans-serif-medium",
    letterSpacing: 0.19,
  },
  locationBtn: {
    flexDirection: 'row',
    backgroundColor: "#21C996",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#18c99e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 2,
  },
  locationBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12.2,
    letterSpacing: 0.2,
  },
  locationInputRow: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#f3fcf8', 
    borderRadius: 14, 
    borderWidth: 1.7, 
    borderColor: '#e8f8f2',
    paddingHorizontal: 15,
    paddingVertical: 2,
    marginTop: 0,
    shadowColor: "#3ceadf",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  locationInput: {
    paddingVertical: 11, 
    fontSize: 16.5, 
    paddingLeft: 0,
  },
  locationMoreBtn: {
    marginLeft: 10,
    backgroundColor: "#d3eafd",
    borderRadius: 13,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
    minHeight: 36,
    borderWidth: 0.7,
    borderColor: "#b2e3e7"
  },

  // --- Fancy Submit Button ---
  submitBtn: {
    backgroundColor: "#FF2323", // Bright red for visibility
    borderRadius: 17,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 2,
    shadowColor: "#A80000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  glowBtn: {
    shadowColor: "#FF8A8A",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 15,
    borderWidth: 2,
    borderColor: "#FF9292",
    backgroundColor: "#FF5959"
  },
  disabledBtn: {
    backgroundColor: "#C2BEBE",
    borderColor: "#E5E4E2",
  },
  submitBtnText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 20,
    letterSpacing: 0.31,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Bold" : "sans-serif-black"
  }
});