import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useLanguage } from "../../contexts/LanguageContext";
import { API_BASE_URL, getAuthHeaders, parseResponseJson } from "../../lib/api";

const DUMMY_IMG = "https://cdn-icons-png.flaticon.com/512/616/616408.png";

export default function AdoptionNew() {
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState("");

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("", t("adoptionNew.photoPermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const a = result.assets[0];
    if (a.base64) setPhotoUri(`data:image/jpeg;base64,${a.base64}`);
    else if (a.uri) setPhotoUri(a.uri);
  };

  const onSubmit = async () => {
    if (!petName.trim() || !petSpecies.trim() || !petAge.trim()) {
      Alert.alert(t("adoptionNew.missingInfoTitle"), t("adoptionNew.missingInfoBody"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/me/adoption-listings`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          pet_name: petName.trim(),
          species: petSpecies.trim(),
          breed: petBreed.trim() || null,
          age_label: petAge.trim(),
          description: description.trim() || null,
          photo_url: photoUri.trim() || null,
        }),
      });
      const parsed = await parseResponseJson<{ error?: string }>(res);
      if (!res.ok || !parsed.ok) {
        Alert.alert("", parsed.data?.error || t("adoptionNew.submitError"));
        return;
      }
      Alert.alert(t("adoptionNew.petListedTitle"), `${petName.trim()} ${t("adoptionNew.petListedBody")}`);
      setPetName("");
      setPetSpecies("");
      setPetBreed("");
      setPetAge("");
      setDescription("");
      setPhotoUri("");
      router.replace("/profile");
    } catch {
      Alert.alert("", t("adoptionNew.submitError"));
    } finally {
      setLoading(false);
    }
  };

  const rowDir = isRTL ? "row-reverse" : "row";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={[styles.toolbar, { flexDirection: rowDir }]}>
          <TouchableOpacity hitSlop={12} style={styles.backFab} onPress={() => router.back()}>
            <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#2b415c" />
          </TouchableOpacity>
          <Text style={[styles.toolbarTitle, { textAlign: isRTL ? "right" : "left", flex: 1 }]} numberOfLines={1}>
            {t("adoptionNew.title")}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.intro, { textAlign: isRTL ? "right" : "center" }]}>{t("adoptionNew.intro")}</Text>

          <View style={styles.photoBlock}>
            <TouchableOpacity activeOpacity={0.75} style={styles.imagePicker} onPress={() => void pickImage()}>
              <Image source={{ uri: photoUri || DUMMY_IMG }} style={styles.petImage} resizeMode="cover" />
              <View style={styles.cameraIconWrap}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={[styles.photoLabel, { textAlign: isRTL ? "right" : "center" }]}>{t("adoptionNew.petPhoto")}</Text>
          </View>

          <TextInput
            placeholder={t("adoptionNew.petNamePh")}
            value={petName}
            onChangeText={setPetName}
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholderTextColor="#b5bed9"
          />
          <TextInput
            placeholder={t("adoptionNew.speciesPh")}
            value={petSpecies}
            onChangeText={setPetSpecies}
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholderTextColor="#b5bed9"
          />
          <TextInput
            placeholder={t("adoptionNew.breedPh")}
            value={petBreed}
            onChangeText={setPetBreed}
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholderTextColor="#b5bed9"
          />
          <TextInput
            placeholder={t("adoptionNew.agePh")}
            value={petAge}
            onChangeText={setPetAge}
            style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholderTextColor="#b5bed9"
          />
          <TextInput
            placeholder={t("adoptionNew.descriptionPh")}
            value={description}
            onChangeText={setDescription}
            style={[
              styles.input,
              { minHeight: 100, textAlignVertical: "top", textAlign: isRTL ? "right" : "left" },
            ]}
            multiline
            placeholderTextColor="#b5bed9"
          />

          <TouchableOpacity style={styles.submitButton} onPress={() => void onSubmit()} disabled={loading} activeOpacity={0.87}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="dog-side" size={19} color="#fff" style={{ marginHorizontal: 7 }} />
                <Text style={styles.submitButtonText}>{t("adoptionNew.submit")}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fbfbff" },
  flex: { flex: 1 },
  toolbar: { alignItems: "center", paddingHorizontal: 12, paddingBottom: 8 },
  backFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toolbarTitle: { fontSize: 17, fontWeight: "800", color: "#2b415c" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { fontSize: 13, color: "#627ec6", marginBottom: 8, lineHeight: 19 },
  photoBlock: { alignItems: "center", marginVertical: 16 },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e9f2fc",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#c6ddfc",
  },
  petImage: { width: "100%", height: "100%" },
  cameraIconWrap: {
    position: "absolute",
    bottom: 6,
    right: 10,
    backgroundColor: "#627ec6",
    padding: 5,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#fff",
  },
  photoLabel: {
    marginTop: 10,
    fontSize: 13,
    color: "#627ec6",
    letterSpacing: 0.4,
    width: "100%",
  },
  input: {
    backgroundColor: "#f2f5fa",
    borderColor: "#e2e6ee",
    borderWidth: 1.3,
    borderRadius: 10,
    fontSize: 16,
    color: "#2b415c",
    marginBottom: 12,
    paddingVertical: Platform.OS === "ios" ? 13 : 10,
    paddingHorizontal: 14,
    width: "100%",
  },
  submitButton: {
    marginTop: 18,
    backgroundColor: "#34a853",
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#93e1b4",
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
